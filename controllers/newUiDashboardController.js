const { Op, fn, literal } = require('sequelize')
const { Proposals, Customer, User } = require('../models/index')

const ACTIVE_STATUSES = [
  'draft',
  'Draft',
  'sent',
  'Follow up 1',
  'Follow up 2',
  'Follow up 3',
  'Measurement Scheduled',
  'Measurement done',
  'Design done',
  'Proposal done',
]

const AWAITING_APPROVAL_STATUSES = [
  'sent',
  'Proposal done',
  'Follow up 1',
  'Follow up 2',
  'Follow up 3',
]

const normalizeNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const clampDelta = (value) => {
  if (!Number.isFinite(value)) return 0
  return Math.max(Math.min(Math.round(value), 999), -999)
}

const computeDelta = (current, previous) => {
  if (!Number.isFinite(current)) current = 0
  if (!Number.isFinite(previous)) previous = 0
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return clampDelta(((current - previous) / previous) * 100)
}

const computeImprovementDelta = (current, previous) => {
  if (!Number.isFinite(current)) current = 0
  if (!Number.isFinite(previous)) previous = 0
  if (previous === 0) {
    return 0
  }
  return clampDelta(((previous - current) / previous) * 100)
}

const parsePrice = (raw) => {
  if (!raw) return 0
  let data = raw
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch (error) {
      return 0
    }
  }

  if (typeof data !== 'object' || data === null) {
    return 0
  }

  const candidates = [
    data.totalPrice,
    data.total_price,
    data.total,
    data.grandTotal,
    data.grand_total,
    data.summary?.totalPrice,
    data.summary?.grandTotal,
  ]

  for (const candidate of candidates) {
    const value = Number(candidate)
    if (Number.isFinite(value)) {
      return value
    }
  }

  return 0
}

const statusToStage = (status) => {
  const normalized = (status || '').toString().toLowerCase()

  if (['follow up 1', 'follow up 2', 'follow up 3'].includes(normalized)) {
    return 'negotiation'
  }

  if (['sent', 'proposal done'].includes(normalized)) {
    return 'awaitingSign'
  }

  if (['accepted', 'proposal accepted'].includes(normalized)) {
    return 'awaitingSign'
  }

  return 'review'
}

const computePriority = (date) => {
  if (!date) return 'low'
  const due = new Date(date)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays <= 1) return 'high'
  if (diffDays <= 3) return 'medium'
  return 'low'
}

const buildProposalScope = (user) => {
  const where = { isDeleted: false }
  if (!user) {
    return where
  }

  const role = String(user.role || '').toLowerCase()
  const isAdmin = role === 'admin' || role === 'super_admin'
  const groupId = user.group_id || null
  const groupType = user.group?.group_type || user.group?.type || null
  const isContractor = groupType === 'contractor'

  if (isAdmin) {
    return where
  }

  if (isContractor) {
    if (groupId) {
      where[Op.or] = [
        { owner_group_id: groupId },
        {
          [Op.and]: [
            { owner_group_id: { [Op.is]: null } },
            { created_by_user_id: user.id },
          ],
        },
      ]
    } else {
      where.created_by_user_id = user.id
    }
    return where
  }

  if (groupId) {
    where[Op.or] = [
      { owner_group_id: groupId },
      { created_by_user_id: user.id },
      { accepted_by: { [Op.in]: [user.id, String(user.id)] } },
    ]
  } else {
    where[Op.or] = [
      { created_by_user_id: user.id },
      { accepted_by: { [Op.in]: [user.id, String(user.id)] } },
    ]
  }

  return where
}

const getDashboardSummary = async (req, res) => {
  try {
    const user = req.user
    const scope = buildProposalScope(user)

    const now = new Date()
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    const sevenDaysAgo = new Date(now.getTime() - sevenDaysMs)
    const fourteenDaysAgo = new Date(now.getTime() - sevenDaysMs * 2)
    const sevenDaysAhead = new Date(now.getTime() + sevenDaysMs)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const activeStatusFilter = { [Op.in]: ACTIVE_STATUSES }
    const awaitingStatusFilter = { [Op.in]: AWAITING_APPROVAL_STATUSES }

    const [
      activeQuotesTotal,
      activeQuotesCurrent,
      activeQuotesPrevious,
      awaitingTotal,
      awaitingCurrent,
      awaitingPrevious,
      openTasksTotal,
      openTasksCurrent,
      openTasksPrevious,
      responseCurrent,
      responsePrevious,
      pipelineRows,
      taskCandidates,
    ] = await Promise.all([
      Proposals.count({ where: { ...scope, status: activeStatusFilter } }),
      Proposals.count({
        where: {
          ...scope,
          status: activeStatusFilter,
          updatedAt: { [Op.gte]: sevenDaysAgo },
        },
      }),
      Proposals.count({
        where: {
          ...scope,
          status: activeStatusFilter,
          updatedAt: { [Op.between]: [fourteenDaysAgo, sevenDaysAgo] },
        },
      }),
      Proposals.count({ where: { ...scope, status: awaitingStatusFilter } }),
      Proposals.count({
        where: {
          ...scope,
          status: awaitingStatusFilter,
          updatedAt: { [Op.gte]: sevenDaysAgo },
        },
      }),
      Proposals.count({
        where: {
          ...scope,
          status: awaitingStatusFilter,
          updatedAt: { [Op.between]: [fourteenDaysAgo, sevenDaysAgo] },
        },
      }),
      Proposals.count({
        where: {
          ...scope,
          [Op.or]: [
            {
              [Op.and]: [
                { measurementDate: { [Op.ne]: null } },
                { measurementDone: { [Op.not]: true } },
              ],
            },
            {
              [Op.and]: [
                { designDate: { [Op.ne]: null } },
                { designDone: { [Op.not]: true } },
              ],
            },
          ],
        },
      }),
      Proposals.count({
        where: {
          ...scope,
          [Op.or]: [
            {
              [Op.and]: [
                { measurementDate: { [Op.between]: [now, sevenDaysAhead] } },
                { measurementDone: { [Op.not]: true } },
              ],
            },
            {
              [Op.and]: [
                { designDate: { [Op.between]: [now, sevenDaysAhead] } },
                { designDone: { [Op.not]: true } },
              ],
            },
          ],
        },
      }),
      Proposals.count({
        where: {
          ...scope,
          [Op.or]: [
            {
              [Op.and]: [
                { measurementDate: { [Op.between]: [sevenDaysAgo, now] } },
                { measurementDone: { [Op.not]: true } },
              ],
            },
            {
              [Op.and]: [
                { designDate: { [Op.between]: [sevenDaysAgo, now] } },
                { designDone: { [Op.not]: true } },
              ],
            },
          ],
        },
      }),
      Proposals.findOne({
        where: {
          ...scope,
          accepted_at: { [Op.ne]: null },
          sent_at: { [Op.ne]: null },
          updatedAt: { [Op.gte]: thirtyDaysAgo },
        },
        attributes: [[fn('AVG', literal('TIMESTAMPDIFF(SECOND, sent_at, accepted_at)')), 'avgSeconds']],
        raw: true,
      }),
      Proposals.findOne({
        where: {
          ...scope,
          accepted_at: { [Op.ne]: null },
          sent_at: { [Op.ne]: null },
          updatedAt: { [Op.between]: [sixtyDaysAgo, thirtyDaysAgo] },
        },
        attributes: [[fn('AVG', literal('TIMESTAMPDIFF(SECOND, sent_at, accepted_at)')), 'avgSeconds']],
        raw: true,
      }),
      Proposals.findAll({
        where: {
          ...scope,
          type: '0',
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        order: [['updatedAt', 'DESC']],
        limit: 6,
      }),
      Proposals.findAll({
        where: {
          ...scope,
          [Op.or]: [
            { measurementDate: { [Op.ne]: null } },
            { designDate: { [Op.ne]: null } },
          ],
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name'],
            required: false,
          },
          {
            model: User,
            as: 'Owner',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        order: [
          [literal('COALESCE(measurementDate, designDate) IS NULL'), 'ASC'],
          [literal('COALESCE(measurementDate, designDate)'), 'ASC'],
        ],
        limit: 10,
      }),
    ])

    const avgSecondsCurrent = normalizeNumber(responseCurrent?.avgSeconds)
    const avgSecondsPrevious = normalizeNumber(responsePrevious?.avgSeconds)
    const avgHours = avgSecondsCurrent ? avgSecondsCurrent / 3600 : 0

    const metrics = [
      {
        id: 'activeQuotes',
        value: activeQuotesTotal,
        delta: computeDelta(activeQuotesCurrent, activeQuotesPrevious),
        icon: 'FileText',
      },
      {
        id: 'awaitingApprovals',
        value: awaitingTotal,
        delta: computeDelta(awaitingCurrent, awaitingPrevious),
        icon: 'Stamp',
      },
      {
        id: 'openTasks',
        value: openTasksTotal,
        delta: computeDelta(openTasksCurrent, openTasksPrevious),
        icon: 'CheckSquare',
      },
      {
        id: 'avgResponseTime',
        value: Number(avgHours.toFixed(2)),
        delta: computeImprovementDelta(avgSecondsCurrent, avgSecondsPrevious),
        icon: 'TimerReset',
      },
    ]

    const pipeline = pipelineRows.map((proposal) => {
      const name = proposal.customer?.name || proposal.description || `Proposal #${proposal.id}`
      const value = parsePrice(proposal.manufacturersData)
      return {
        id: proposal.id,
        name,
        stage: statusToStage(proposal.status),
        value,
        updatedAt: proposal.updatedAt,
      }
    })

    const tasks = []
    for (const proposal of taskCandidates) {
      const ownerName = proposal.Owner?.name || user?.name || 'Team'
      const customerName = proposal.customer?.name || proposal.description || `Proposal #${proposal.id}`

      if (proposal.measurementDate && proposal.measurementDone !== true) {
        tasks.push({
          id: `measurement-${proposal.id}`,
          title: `Measurement for ${customerName}`,
          owner: ownerName,
          dueOn: new Date(proposal.measurementDate).toISOString().slice(0, 10),
          priority: computePriority(proposal.measurementDate),
        })
      }

      if (proposal.designDate && proposal.designDone !== true) {
        tasks.push({
          id: `design-${proposal.id}`,
          title: `Design review for ${customerName}`,
          owner: ownerName,
          dueOn: new Date(proposal.designDate).toISOString().slice(0, 10),
          priority: computePriority(proposal.designDate),
        })
      }

      if (tasks.length >= 6) {
        break
      }
    }

    return res.json({
      success: true,
      data: {
        metrics,
        pipeline,
        tasks,
        highlights: {},
        fallback: false,
      },
    })
  } catch (error) {
    console.error('Error building new UI dashboard summary:', error)
    return res.status(500).json({
      success: false,
      message: 'Unable to build dashboard summary',
    })
  }
}

module.exports = {
  getDashboardSummary,
}
