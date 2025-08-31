// src/pages/Companies.tsx
import { useState } from 'react'
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap'
import {
  useGetCompaniesQuery, useCreateCompanyMutation,
  useUpdateCompanyMutation, useDeleteCompanyMutation, Company, api
} from '../../services/api'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ModalForm from '../../components/ModalForm'
import { can, Role } from '../../utils/rbac'
import { useAppDispatch } from '../../app/hooks'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  domain: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function Companies(){
  const [search,setSearch] = useState('')
  const [page,setPage] = useState(1)
  const limit = 10
  const { data, refetch } = useGetCompaniesQuery({ page, limit, search })
  const [createCompany] = useCreateCompanyMutation()
  const [updateCompany] = useUpdateCompanyMutation()
  const [deleteCompany] = useDeleteCompanyMutation()
  const d = useAppDispatch()

  const user = JSON.parse(localStorage.getItem('user')||'null') as any
  const role = (user?.role || 'viewer') as Role

  // modal state
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)

  const { register, handleSubmit, reset, formState:{ errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  function openAdd(){
    setEditing(null)
    reset({ name:'', domain:'', phone:'', city:'', country:'' })
    setShow(true)
  }
  function openEdit(it: Company){
    setEditing(it)
    reset({ name: it.name || '', domain: it.domain || '', phone: it.phone || '', city: it.city || '', country: it.country || '' })
    setShow(true)
  }
  function close(){ setShow(false) }

  async function onSubmit(v: FormValues){
    if (editing) {
      const patch = d(api.util.updateQueryData('getCompanies', { page, limit, search }, (draft:any)=>{
        const i = draft.data.findIndex((x:Company)=>x.id===editing.id)
        if(i>-1) draft.data[i] = { ...draft.data[i], ...v }
      }))
      try { await updateCompany({ id: editing.id, ...v }).unwrap() } catch { patch.undo() }
    } else {
      const tempId = Math.floor(Math.random()*-1e9)
      const patch = d(api.util.updateQueryData('getCompanies', { page, limit, search }, (draft:any)=>{
        draft.data.unshift({ id: tempId, ...v })
      }))
      try { await createCompany(v as any).unwrap() } catch { patch.undo() }
    }
    close(); refetch()
  }

  async function del(id:number){
    const patch = d(api.util.updateQueryData('getCompanies', { page, limit, search }, (draft:any)=>{
      draft.data = draft.data.filter((x:Company)=>x.id!==id)
    }))
    try { await deleteCompany(id).unwrap() } catch { patch.undo() }
    refetch()
  }

  const items = data?.data ?? []; const total = data?.total ?? 0;

  return (
    <Row className="g-3">
      <Col md={12}>
        <Card><Card.Body className="d-flex gap-2">
          <Form.Control placeholder="Search..." value={search} onChange={(e)=>setSearch(e.target.value)} style={{maxWidth:320}}/>
          <Button onClick={()=>setPage(1)}>Search</Button>
          {can(role,'create','companies') && <Button onClick={openAdd} variant="success">Add Company</Button>}
        </Card.Body></Card>
      </Col>

      <Col md={12}>
        <Card><Card.Body>
          <Card.Title>Companies</Card.Title>
          <Table hover responsive size="sm">
            <thead><tr>
              <th>ID</th><th>Name</th><th>Domain</th><th>Phone</th><th>City</th><th>Country</th><th>Actions</th>
            </tr></thead>
            <tbody>
            {items.map((it:Company)=>(
              <tr key={it.id}>
                <td>{it.id}</td>
                <td>{it.name}</td>
                <td>{it.domain}</td>
                <td>{it.phone}</td>
                <td>{it.city}</td>
                <td>{it.country}</td>
                <td className="d-flex gap-2">
                  {can(role,'update','companies') && <Button size="sm" variant="outline-primary" onClick={()=>openEdit(it)}>Edit</Button>}
                  {can(role,'delete','companies') && <Button size="sm" variant="danger" onClick={()=>del(it.id)}>Delete</Button>}
                </td>
              </tr>
            ))}
            </tbody>
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

      {/* Create/Edit Modal */}
      <ModalForm
        title={editing ? 'Edit Company' : 'Add Company'}
        show={show}
        onHide={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button form="company-form" type="submit" disabled={isSubmitting}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <Form id="company-form" onSubmit={handleSubmit(onSubmit)} className="d-grid gap-3">
          <Form.Group>
            <Form.Label>Name</Form.Label>
            <Form.Control {...register('name')} isInvalid={!!errors.name}/>
            <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
          </Form.Group>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group><Form.Label>Domain</Form.Label><Form.Control {...register('domain')}/></Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group><Form.Label>Phone</Form.Label><Form.Control {...register('phone')}/></Form.Group>
            </Col>
          </Row>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group><Form.Label>City</Form.Label><Form.Control {...register('city')}/></Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group><Form.Label>Country</Form.Label><Form.Control {...register('country')}/></Form.Group>
            </Col>
          </Row>
        </Form>
      </ModalForm>
    </Row>
  )
}
