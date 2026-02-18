import { createContext, useContext } from 'react'

const ThemeContext = createContext(null)

export function useTabTheme() {
  return useContext(ThemeContext)
}

export default ThemeContext
