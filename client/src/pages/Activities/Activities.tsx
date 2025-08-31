// src/pages/Activities.tsx
import { useState } from 'react'
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap'
import {
  useGetActivitiesQuery, useCreateActivityMutation, useUpdateActivityMutation,
  useDeleteActivityMutation, Activity, api
} from '../../services/api'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ModalForm from '../../components/ModalForm'
import { useAppDispatch } from '../../app/hooks'
import { can, Role } from '../../utils/rbac'

const schema = z.object({
  type: z.enum(['call','email','meeting','task']),
  subject: z.string().min(2,'Subject required'),
  dueDate: z.string().optional(),
  status: z.enum(['todo','done'])
})
type FormValues = z.infer<typeof schema>

export default function Activities(){
  const [search,setSearch] = useState(''); const [page,setPage] = useState(1); const limit=10
  const { data, refetch } = useGetActivitiesQuery({ page, limit, search })
  const [createIt] = useCreateActivityMutation()
  const [updateIt] = useUpdateActivityMutation()
  const [deleteIt] = useDeleteActivityMutation()
  const d = useAppDispatch()
  const user = JSON.parse(localStorage.getItem('user')||'null') as any
  const role = (user?.role || 'viewer') as Role

  const [show,setShow]=useState(false); const [editing,setEditing]=useState<Activity|null>(null)
  const { register, handleSubmit, reset, formState:{ errors, isSubmitting } } = useForm<FormValues>({ resolver:zodResolver(schema) })

  function openAdd(){ setEditing(null); reset({ type:'task', subject:'', status:'todo', dueDate:'' }); setShow(true) }
  function openEdit(it:Activity){ setEditing(it); reset({ type:it.type, subject:it.subject, status:it.status, dueDate: it.dueDate?.slice(0,10) }); setShow(true) }
  function close(){ setShow(false) }

  async function onSubmit(v:FormValues){
    if (editing){
      const patch=d(api.util.updateQueryData('getActivities',{page,limit,search},(draft:any)=>{ const i=draft.data.findIndex((x:Activity)=>x.id===editing.id); if(i>-1) draft.data[i]={...draft.data[i],...v} }))
      try{ await updateIt({ id: editing.id, ...v }).unwrap() }catch{ patch.undo() }
    } else {
      const tempId=Math.floor(Math.random()*-1e9)
      const patch=d(api.util.updateQueryData('getActivities',{page,limit,search},(draft:any)=>{ draft.data.unshift({id:tempId,...v}) }))
      try{ await createIt(v as any).unwrap() }catch{ patch.undo() }
    }
    close(); refetch()
  }
  async function del(id:number){ const patch=d(api.util.updateQueryData('getActivities',{page,limit,search},(draft:any)=>{ draft.data=draft.data.filter((x:Activity)=>x.id!==id) })); try{ await deleteIt(id).unwrap() }catch{ patch.undo() }; refetch() }

  const items = data?.data ?? []; const total = data?.total ?? 0;

  return (
    <Row className="g-3">
      <Col md={12}>
        <Card><Card.Body className="d-flex gap-2">
          <Form.Control placeholder="Search..." value={search} onChange={(e)=>setSearch(e.target.value)} style={{maxWidth:320}}/>
          <Button onClick={()=>setPage(1)}>Search</Button>
          {can(role,'create','activities') && <Button variant="success" onClick={openAdd}>Add Activity</Button>}
        </Card.Body></Card>
      </Col>

      <Col md={12}>
        <Card><Card.Body>
          <Card.Title>Activities</Card.Title>
          <Table hover responsive size="sm">
            <thead><tr><th>ID</th><th>Type</th><th>Subject</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{items.map((it:Activity)=>(
              <tr key={it.id}>
                <td>{it.id}</td><td className="text-capitalize">{it.type}</td><td>{it.subject}</td><td>{it.dueDate?.slice(0,10)}</td><td>{it.status}</td>
                <td className="d-flex gap-2">
                  {can(role,'update','activities') && <Button size="sm" variant="outline-primary" onClick={()=>openEdit(it)}>Edit</Button>}
                  {can(role,'delete','activities') && <Button size="sm" variant="danger" onClick={()=>del(it.id)}>Delete</Button>}
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
        title={editing ? 'Edit Activity' : 'Add Activity'}
        show={show}
        onHide={close}
        footer={<>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button form="activity-form" type="submit" disabled={isSubmitting}>{editing?'Update':'Create'}</Button>
        </>}
      >
        <Form id="activity-form" onSubmit={handleSubmit(onSubmit)} className="d-grid gap-3">
          <Row className="g-3">
            <Col md={6}><Form.Group><Form.Label>Type</Form.Label><Form.Select {...register('type')}>
              {['call','email','meeting','task'].map(t=><option key={t} value={t}>{t}</option>)}
            </Form.Select></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Status</Form.Label><Form.Select {...register('status')}>
              {['todo','done'].map(t=><option key={t} value={t}>{t}</option>)}
            </Form.Select></Form.Group></Col>
          </Row>
          <Form.Group><Form.Label>Subject</Form.Label><Form.Control {...register('subject')} isInvalid={!!errors.subject}/><Form.Control.Feedback type="invalid">{errors.subject?.message}</Form.Control.Feedback></Form.Group>
          <Form.Group><Form.Label>Due date</Form.Label><Form.Control type="date" {...register('dueDate')}/></Form.Group>
        </Form>
      </ModalForm>
    </Row>
  )
}
