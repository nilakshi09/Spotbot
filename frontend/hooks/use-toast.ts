import { toast as sonnerToast } from 'sonner'

export function useToast() {
  return {
    toast: {
      success: (msg: string) => sonnerToast.success(msg),
      info: (msg: string) => sonnerToast.info(msg),
      error: (msg: string) => sonnerToast.error(msg),
    }
  }
}
