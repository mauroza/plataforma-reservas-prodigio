import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: 'admin' | 'staff'
    }
  }
  interface User {
    role: 'admin' | 'staff'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'staff'
    id: string
  }
}
