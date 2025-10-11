import React from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

import { ChevronDown } from 'lucide-react'

const languages = ['en', 'es']

const LanguageSwitcher = ({ compact = false }) => {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage || i18n.language || 'en'

  const handleChange = (nextLanguage) => {
    i18n.changeLanguage(nextLanguage)
    try {
      localStorage.setItem('lang', nextLanguage)
    } catch (_) {
      // ignore persistence failures
    }
  }

  const minWidth = compact ? 'auto' : '140px'
  const currentLabel = t(`languages.${current === 'en' ? 'english' : 'spanish'}`)

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        size="sm"
        minH="44px"
        minW={minWidth}
        variant={compact ? 'ghost' : 'outline'}
        rightIcon={<ChevronDown size={14} />}
      >
        {currentLabel}
      </MenuButton>
      <MenuList minW={{ base: "calc(100vw - 32px)", sm: minWidth }} maxW={{ base: "calc(100vw - 32px)", sm: "240px" }}>
        <MenuOptionGroup type="radio" value={current} onChange={handleChange}>
          {languages.map((lang) => (
            <MenuItemOption key={lang} value={lang}>
              {t(`languages.${lang === 'en' ? 'english' : 'spanish'}`)}
            </MenuItemOption>
          ))}
        </MenuOptionGroup>
      </MenuList>
    </Menu>
  )
}

LanguageSwitcher.propTypes = {
  compact: PropTypes.bool,
}

LanguageSwitcher.defaultProps = {
  compact: false,
}

export default LanguageSwitcher
