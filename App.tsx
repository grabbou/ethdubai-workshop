import './app/polyfills'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StyleSheet, View } from 'react-native'

import Home from './app/pages/Home'

/**
 * Create React Query with Suspense support by default
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
        <Home />
      </View>
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
