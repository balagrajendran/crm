
import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, useGetActivitiesQuery, useCreateActivityMutation, useUpdateActivityMutation, useDeleteActivityMutation } from '../services/api'
import { useAppDispatch } from '../app/hooks'

const schema = z.object({
  type: z.enum(['call','email','meeting','task']),
  subject: z.string().min(2),
  dueDate: z.string().optional(),
  status: z.enum(['todo','done']),
  CompanyId: z.coerce.number().int().optional(),
  ContactId: z.coerce.number().int().optional(),
  DealId: z.coerce.number().int().optional(),
})
type FormValues = z.infer<typeof schema>

export default function Activities(){
  const [search,setSearch] = useState('')
  const [page,setPage] = useState(1)
  const limit = 10
  const d = useAppDispatch()

  const { data, refetch } = useGetActivitiesQuery({ page, limit, search })
  const [createIt] = useCreateActivityMutation()
  const [updateIt] = useUpdateActivityMutation()
  const [deleteIt] = useDeleteActivityMutation()

  const { register, handleSubmit, reset, setValue, formState:{errors} } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [editingId,setEditingId] = useState<number|null>(null)

  useEffect(()=>{ refetch() },[page,search])
  const items = data?.data ?? []; const total = data?.total ?? 0;

  async function onSubmit(v:FormValues){
    if (editingId) {
      const patch = d(api.util.updateQueryData('getActivities', { page, limit, search }, (draft:any)=>{
        const i = draft.data.findIndex((x:any)=>x.id===editingId); if(i>-1) draft.data[i] = { ...draft.data[i], ...v }
      }))
      try { await updateIt({ id: editingId, ...v }).unwrap() } catch(e) { patch.undo() }
      setEditingId(null); reset(); refetch()
    } else {
      const tempId = Math.floor(Math.random()*-1e6)
      const patch = d(api.util.updateQueryData('getActivities', { page, limit, search }, (draft:any)=>{ draft.data.unshift({ id: tempId, ...v }) }))
      try { await createIt(v as any).unwrap() } catch(e) { patch.undo() }
      reset(); refetch()
    }
  }
  async function del(id:number){
    const patch = d(api.util.updateQueryData('getActivities', { page, limit, search }, (draft:any)=>{ draft.data = draft.data.filter((x:any)=>x.id!==id) }))
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
          <Card.Title>Activities</Card.Title>
          <Table striped hover size="sm" className="align-middle mt-2">
            <thead>
              <tr>
                <th>ID</th>
                <th>type</th><th>subject</th><th>dueDate</th><th>status</th><th>CompanyId</th><th>ContactId</th><th>DealId</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(items as any[]).map((it:any)=>(
                <tr key={it.id}>
                  <td>{it.id}</td>
                  <td>{it.type}</td><td>{it.subject}</td><td>{it.dueDate}</td><td>{it.status}</td><td>{it.CompanyId}</td><td>{it.ContactId}</td><td>{it.DealId}</td>
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
          <Card.Title>{editingId ? 'Edit' : 'Add'} Activity</Card.Title>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row className="g-3">
              <Col md={6}><Form.Group><Form.Label>type</Form.Label><Form.Select {...register('type')} isInvalid={!!errors.type}><option>call</option><option>email</option><option>meeting</option><option>task</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>subject</Form.Label><Form.Control {...register('subject')} isInvalid={!!errors.subject}/><Form.Control.Feedback type="invalid">{errors.subject?.message}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>dueDate</Form.Label><Form.Control type="date" {...register('dueDate')} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>status</Form.Label><Form.Select {...register('status')} isInvalid={!!errors.status}><option>todo</option><option>done</option></Form.Select></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label>CompanyId</Form.Label><Form.Control {...register('CompanyId')} isInvalid={!!errors.CompanyId}/></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label>ContactId</Form.Label><Form.Control {...register('ContactId')} isInvalid={!!errors.ContactId}/></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label>DealId</Form.Label><Form.Control {...register('DealId')} isInvalid={!!errors.DealId}/></Form.Group></Col>
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
