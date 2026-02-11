import { Button } from '@/components/base/buttons/button'

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-4 bg-primary p-8">
      <Button color="primary" size="md">
        Primary Button
      </Button>
      <Button color="secondary" size="md">
        Secondary Button
      </Button>
      <Button color="tertiary" size="md">
        Tertiary Button
      </Button>
    </div>
  )
}

export default App
