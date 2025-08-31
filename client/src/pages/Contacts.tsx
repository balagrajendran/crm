
import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, useGetContactsQuery, useCreateContactMutation, useUpdateContactMutation, useDeleteContactMutation } from '../services/api'
import { useAppDispatch } from '../app/hooks'

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  CompanyId: z.coerce.number().int().optional(),
})
type FormValues = z.infer<typeof schema>

export default function Contacts(){
  const [search,setSearch] = useState('')
  const [page,setPage] = useState(1)
  const limit = 10
  const d = useAppDispatch()

  const { data, refetch } = useGetContactsQuery({ page, limit, search })
  const [createIt] = useCreateContactMutation()
  const [updateIt] = useUpdateContactMutation()
  const [deleteIt] = useDeleteContactMutation()

  const { register, handleSubmit, reset, setValue, formState:{errors} } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [editingId,setEditingId] = useState<number|null>(null)

  useEffect(()=>{ refetch() },[page,search])
  const items = data?.data ?? []; const total = data?.total ?? 0;

  async function onSubmit(v:FormValues){
    if (editingId) {
      const patch = d(api.util.updateQueryData('getContacts', { page, limit, search }, (draft:any)=>{
        const i = draft.data.findIndex((x:any)=>x.id===editingId); if(i>-1) draft.data[i] = { ...draft.data[i], ...v }
      }))
      try { await updateIt({ id: editingId, ...v }).unwrap() } catch(e) { patch.undo() }
      setEditingId(null); reset(); refetch()
    } else {
      const tempId = Math.floor(Math.random()*-1e6)
      const patch = d(api.util.updateQueryData('getContacts', { page, limit, search }, (draft:any)=>{ draft.data.unshift({ id: tempId, ...v }) }))
      try { await createIt(v as any).unwrap() } catch(e) { patch.undo() }
      reset(); refetch()
    }
  }
  async function del(id:number){
    const patch = d(api.util.updateQueryData('getContacts', { page, limit, search }, (draft:any)=>{ draft.data = draft.data.filter((x:any)=>x.id!==id) }))
    try { await deleteIt(id).unwrap() } catch(e) { patch.undo() }
    refetch()
  }
  function editRow(it:any){
    setEditingId(it.id)
    Object.keys(it).forEach((k)=>setValue(k as any, it[k]))
  }

  return (
    <Row className="g-3">
      <Col md={12}>
        <Card><Card.Body>
          <div className="d-flex gap-2">
            <Form.Control placeholder="Search..." value={search} onChange={(e)=>setSearch(e.target.value)} style={{maxWidth:320}}/>
            <Button onClick={()=>setPage(1)}>Search</Button>
          </div>
        </Card.Body></Card>
      </Col>

      <Col md={12}>
        <Card><Card.Body>
          <Card.Title>Contacts</Card.Title>
          <Table striped hover size="sm" className="align-middle mt-2">
            <thead>
              <tr>
                <th>ID</th>
                <th>firstName</th><th>lastName</th><th>email</th><th>phone</th><th>CompanyId</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(items as any[]).map((it:any)=> (
                <tr key={it.id}>
                  <td>{it.id}</td>
                  <td>{it.firstName}</td><td>{it.lastName}</td><td>{it.email}</td><td>{it.phone}</td><td>{it.CompanyId}</td>
                  <td className="table-actions">
                    <Button variant="outline-secondary" size="sm" onClick={()=>editRow(it)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={()=>del(it.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="d-flex justify-content-between">
            <div>Page {page} of {Math.ceil(total/limit)||1}</div>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
              <Button variant="outline-secondary" onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          </div>
        </Card.Body></Card>
      </Col>

      <Col md={12}>
        <Card><Card.Body>
          <Card.Title>{editingId ? 'Edit' : 'Add'} Contact</Card.Title>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row className="g-3">
              <Col md={6}><Form.Group><Form.Label>firstName</Form.Label><Form.Control {...register('firstName')} isInvalid={!!errors.firstName}/><Form.Control.Feedback type="invalid">{errors.firstName?.message}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>lastName</Form.Label><Form.Control {...register('lastName')} isInvalid={!!errors.lastName}/><Form.Control.Feedback type="invalid">{errors.lastName?.message}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>email</Form.Label><Form.Control {...register('email')} isInvalid={!!errors.email}/><Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>phone</Form.Label><Form.Control {...register('phone')} isInvalid={!!errors.phone}/><Form.Control.Feedback type="invalid">{errors.phone?.message}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>CompanyId</Form.Label><Form.Control {...register('CompanyId')} isInvalid={!!errors.CompanyId}/><Form.Control.Feedback type="invalid">{errors.CompanyId?.message}</Form.Control.Feedback></Form.Group></Col>
              <Col md={12} className="d-flex gap-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                {editingId && <Button variant="secondary" onClick={()=>{setEditingId(null); reset()}}>Cancel</Button>}
              </Col>
            </Row>
          </Form>
        </Card.Body></Card>
      </Col>
    </Row>
  )
}
