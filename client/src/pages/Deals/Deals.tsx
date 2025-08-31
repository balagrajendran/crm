// src/pages/Deals.tsx
import { useState } from 'react'
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap'
import {
  useGetDealsQuery, useCreateDealMutation, useUpdateDealMutation,
  useDeleteDealMutation, Deal, api
} from '../../services/api'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ModalForm from '../../components/ModalForm'
import { useAppDispatch } from '../../app/hooks'
import { can, Role } from '../../utils/rbac'

const schema = z.object({
  title: z.string().min(2,'Title required'),
  amount: z.coerce.number().min(0),
  stage: z.enum(['new','qualified','proposal','won','lost'])
})
type FormValues = z.infer<typeof schema>

export default function Deals(){
  const [search,setSearch] = useState(''); const [page,setPage] = useState(1); const limit=10
  const { data, refetch } = useGetDealsQuery({ page, limit, search })
  const [createIt] = useCreateDealMutation()
  const [updateIt] = useUpdateDealMutation()
  const [deleteIt] = useDeleteDealMutation()
  const d = useAppDispatch()
  const user = JSON.parse(localStorage.getItem('user')||'null') as any
  const role = (user?.role || 'viewer') as Role

  const [show,setShow]=useState(false); const [editing,setEditing]=useState<Deal|null>(null)
  const { register, handleSubmit, reset, formState:{ errors, isSubmitting } } = useForm<FormValues>({ resolver:zodResolver(schema) })

  function openAdd(){ setEditing(null); reset({ title:'', amount:0, stage:'new' }); setShow(true) }
  function openEdit(it:Deal){ setEditing(it); reset({ title:it.title, amount:it.amount, stage:it.stage }); setShow(true) }
  function close(){ setShow(false) }

  async function onSubmit(v:FormValues){
    if (editing){
      const patch=d(api.util.updateQueryData('getDeals',{page,limit,search},(draft:any)=>{ const i=draft.data.findIndex((x:Deal)=>x.id===editing.id); if(i>-1) draft.data[i]={...draft.data[i],...v} }))
      try{ await updateIt({ id: editing.id, ...v }).unwrap() }catch{ patch.undo() }
    } else {
      const tempId=Math.floor(Math.random()*-1e9)
      const patch=d(api.util.updateQueryData('getDeals',{page,limit,search},(draft:any)=>{ draft.data.unshift({id:tempId,...v}) }))
      try{ await createIt(v as any).unwrap() }catch{ patch.undo() }
    }
    close(); refetch()
  }
  async function del(id:number){ const patch=d(api.util.updateQueryData('getDeals',{page,limit,search},(draft:any)=>{ draft.data=draft.data.filter((x:Deal)=>x.id!==id) })); try{ await deleteIt(id).unwrap() }catch{ patch.undo() }; refetch() }

  const items = data?.data ?? []; const total = data?.total ?? 0;

  return (
    <Row className="g-3">
      <Col md={12}>
        <Card><Card.Body className="d-flex gap-2">
          <Form.Control placeholder="Search..." value={search} onChange={(e)=>setSearch(e.target.value)} style={{maxWidth:320}}/>
          <Button onClick={()=>setPage(1)}>Search</Button>
          {can(role,'create','deals') && <Button variant="success" onClick={openAdd}>Add Deal</Button>}
        </Card.Body></Card>
      </Col>

      <Col md={12}>
        <Card><Card.Body>
          <Card.Title>Deals</Card.Title>
          <Table hover responsive size="sm">
            <thead><tr><th>ID</th><th>Title</th><th>Amount</th><th>Stage</th><th>Actions</th></tr></thead>
            <tbody>{items.map((it:Deal)=>(
              <tr key={it.id}>
                <td>{it.id}</td><td>{it.title}</td><td>${it.amount?.toLocaleString()}</td><td className="text-capitalize">{it.stage}</td>
                <td className="d-flex gap-2">
                  {can(role,'update','deals') && <Button size="sm" variant="outline-primary" onClick={()=>openEdit(it)}>Edit</Button>}
                  {can(role,'delete','deals') && <Button size="sm" variant="danger" onClick={()=>del(it.id)}>Delete</Button>}
                </td>
              </tr>
            ))}</tbody>
          </Table>

          <div className="d-flex justify-content-between">
            <div>Page {page} of {Math.max(1, Math.ceil(total/limit))}</div>
            <div className="d-flex gap-2">
              <Button size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
              <Button size="sm" disabled={page>=Math.ceil(total/limit)} onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          </div>
        </Card.Body></Card>
      </Col>

      <ModalForm
        title={editing ? 'Edit Deal' : 'Add Deal'}
        show={show}
        onHide={close}
        footer={<>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button form="deal-form" type="submit" disabled={isSubmitting}>{editing?'Update':'Create'}</Button>
        </>}
      >
        <Form id="deal-form" onSubmit={handleSubmit(onSubmit)} className="d-grid gap-3">
          <Form.Group><Form.Label>Title</Form.Label><Form.Control {...register('title')} isInvalid={!!errors.title}/><Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback></Form.Group>
          <Row className="g-3">
            <Col md={6}><Form.Group><Form.Label>Amount</Form.Label><Form.Control type="number" step="1" {...register('amount')} isInvalid={!!errors.amount}/><Form.Control.Feedback type="invalid">{errors.amount?.message}</Form.Control.Feedback></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Stage</Form.Label><Form.Select {...register('stage')}>
              {['new','qualified','proposal','won','lost'].map(s=><option key={s} value={s}>{s}</option>)}
            </Form.Select></Form.Group></Col>
          </Row>
        </Form>
      </ModalForm>
    </Row>
  )
}
