
import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, useGetDealsQuery, useCreateDealMutation, useUpdateDealMutation, useDeleteDealMutation } from '../services/api'
import { useAppDispatch } from '../app/hooks'

const schema = z.object({
  title: z.string().min(2),
  amount: z.coerce.number().nonnegative(),
  stage: z.enum(['new','qualified','proposal','won','lost']),
  CompanyId: z.coerce.number().int().optional(),
  ContactId: z.coerce.number().int().optional(),
})
type FormValues = z.infer<typeof schema>

export default function Deals(){
  const [search,setSearch] = useState('')
  const [page,setPage] = useState(1)
  const limit = 100
  const d = useAppDispatch()

  const { data, refetch } = useGetDealsQuery({ page, limit, search })
  const [createIt] = useCreateDealMutation()
  const [updateIt] = useUpdateDealMutation()
  const [deleteIt] = useDeleteDealMutation()

  const { register, handleSubmit, reset, setValue, formState:{errors} } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [editingId,setEditingId] = useState<number|null>(null)

  useEffect(()=>{ refetch() },[page,search])
  const items = data?.data ?? []; const total = data?.total ?? 0;

  async function onSubmit(v:FormValues){
    if (editingId) {
      const patch = d(api.util.updateQueryData('getDeals', { page, limit, search }, (draft:any)=>{
        const i = draft.data.findIndex((x:any)=>x.id===editingId); if(i>-1) draft.data[i] = { ...draft.data[i], ...v }
      }))
      try { await updateIt({ id: editingId, ...v }).unwrap() } catch(e) { patch.undo() }
      setEditingId(null); reset(); refetch()
    } else {
      const tempId = Math.floor(Math.random()*-1e6)
      const patch = d(api.util.updateQueryData('getDeals', { page, limit, search }, (draft:any)=>{ draft.data.unshift({ id: tempId, ...v }) }))
      try { await createIt(v as any).unwrap() } catch(e) { patch.undo() }
      reset(); refetch()
    }
  }
  async function del(id:number){
    const patch = d(api.util.updateQueryData('getDeals', { page, limit, search }, (draft:any)=>{ draft.data = draft.data.filter((x:any)=>x.id!==id) }))
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
          <Card.Title>Deals</Card.Title>
          <Table striped hover size="sm" className="align-middle mt-2">
            <thead>
              <tr>
                <th>ID</th>
                <th>title</th><th>amount</th><th>stage</th><th>CompanyId</th><th>ContactId</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(items as any[]).map((it:any)=>(
                <tr key={it.id}>
                  <td>{it.id}</td>
                  <td>{it.title}</td><td>{it.amount}</td><td>{it.stage}</td><td>{it.CompanyId}</td><td>{it.ContactId}</td>
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
          <Card.Title>{editingId ? 'Edit' : 'Add'} Deal</Card.Title>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row className="g-3">
              <Col md={6}><Form.Group><Form.Label>title</Form.Label><Form.Control {...register('title')} isInvalid={!!errors.title}/><Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>amount</Form.Label><Form.Control {...register('amount')} isInvalid={!!errors.amount}/><Form.Control.Feedback type="invalid">{errors.amount?.message}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>stage</Form.Label><Form.Select {...register('stage')} isInvalid={!!errors.stage}><option>new</option><option>qualified</option><option>proposal</option><option>won</option><option>lost</option></Form.Select><Form.Control.Feedback type="invalid">{errors.stage?.message}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>CompanyId</Form.Label><Form.Control {...register('CompanyId')} isInvalid={!!errors.CompanyId}/><Form.Control.Feedback type="invalid">{errors.CompanyId?.message}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>ContactId</Form.Label><Form.Control {...register('ContactId')} isInvalid={!!errors.ContactId}/><Form.Control.Feedback type="invalid">{errors.ContactId?.message}</Form.Control.Feedback></Form.Group></Col>
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
