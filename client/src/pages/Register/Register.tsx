import { Button, Card, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRegisterMutation } from '../../services/api'
import { Link } from 'react-router-dom'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
})
type FormValues = z.infer<typeof schema>

export default function Register(){
  const [registerM,{isLoading,isError}] = useRegisterMutation()
  const { register, handleSubmit, formState:{ errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name:'Admin', email:'admin@example.com', password:'admin123' }
  })
  const onSubmit = async (v:FormValues)=>{ try{ await registerM(v).unwrap(); location.href='/' }catch{} }

  return (
    <Card className="mx-auto" style={{maxWidth: 420}}>
      <Card.Body>
        <Card.Title>Create account</Card.Title>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control {...register('name')} isInvalid={!!errors.name}/>
            <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control {...register('email')} isInvalid={!!errors.email}/>
            <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" {...register('password')} isInvalid={!!errors.password}/>
            <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
          </Form.Group>
          <Button type="submit" disabled={isLoading} className="w-100">
            {isLoading ? 'Creating…' : 'Register'}
          </Button>
          {isError && <div className="text-danger mt-3">Registration failed</div>}
          <div className="mt-3 small">
            Have an account? <Link to="/login">Sign in</Link>
          </div>
        </Form>
      </Card.Body>
    </Card>
  )
}
