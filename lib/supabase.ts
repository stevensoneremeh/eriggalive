import { signup } from './path/to/supabase.js'

async function handleSignup(event) {
  event.preventDefault()
  
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  
  const result = await signup(email, password)
  
  if (result.error) {
    // Handle signup error
    alert(result.error)
  } else {
    // Signup successful
    alert('Check your email for confirmation')
  }
}
