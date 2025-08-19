const { Customer, Proposals, User, Location } = require('../models/index');


// routes/proposals.js
const fetchEvents = async (req, res) => {
    try {
        const proposals = await Proposals.findAll({
            where: { isDeleted: false },
            attributes: [
                'id', 'measurementDate', 'designDate',
                'followUp1Date', 'followUp2Date', 'followUp3Date',
                'description', 'salesRep'
            ]
        });

        const events = [];

        proposals.forEach(p => {
            const pushEvent = (date, title) => {
                if (date) {
                    events.push({
                        id: p.id,
                        title,
                        date,
                        salesRep: p.salesRep,
                        description: p.description
                    });
                }
            };

            pushEvent(p.measurementDate, 'Measurement Scheduled');
            pushEvent(p.designDate, 'Design Scheduled');
            pushEvent(p.followUp1Date, 'Follow Up 1');
            pushEvent(p.followUp2Date, 'Follow Up 2');
            pushEvent(p.followUp3Date, 'Follow Up 3');
        });

        res.json({ success: true, events });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



module.exports = {
    fetchEvents
};