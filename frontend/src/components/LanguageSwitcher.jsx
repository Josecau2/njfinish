import React from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuRadioItem,
  MenuRadioItemGroup,
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
    <MenuRoot placement="bottom-end">
      <MenuTrigger asChild>
        <Button
          size="sm"
          minH="44px"
          minW={minWidth}
          variant={compact ? 'ghost' : 'outline'}
        >
          {currentLabel}
          <ChevronDown size={14} />
        </Button>
      </MenuTrigger>
      <MenuContent minW={minWidth}>
        <MenuRadioItemGroup value={current} onValueChange={(e) => handleChange(e.value)}>
          {languages.map((lang) => (
            <MenuRadioItem key={lang} value={lang}>
              {t(`languages.${lang === 'en' ? 'english' : 'spanish'}`)}
            </MenuRadioItem>
          ))}
        </MenuRadioItemGroup>
      </MenuContent>
    </MenuRoot>
  )
}

LanguageSwitcher.propTypes = {
  compact: PropTypes.bool,
}

LanguageSwitcher.defaultProps = {
  compact: false,
}

export default LanguageSwitcher
