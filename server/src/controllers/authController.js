
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { User } from '../models/index.js'

function sign(user){
  return jwt.sign({ id:user.id, role:user.role }, process.env.JWT_SECRET, { expiresIn:'7d' })
}

export async function register(req,res){
  const { name, email, password } = req.body
  const exists = await User.findOne({ where:{ email } })
  if(exists) return res.status(400).json({ error:'Email already used' })
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, passwordHash, role:'viewer' })
  const token = sign(user)
  res.json({ token, user: { id:user.id, name:user.name, email:user.email, role:user.role } })
}

export async function login(req,res){
  const { email, password } = req.body
  const user = await User.findOne({ where:{ email } })
  if(!user) return res.status(401).json({ error:'Invalid credentials' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if(!ok) return res.status(401).json({ error:'Invalid credentials' })
  const token = sign(user)
  res.json({ token, user: { id:user.id, name:user.name, email:user.email, role:user.role } })
}

export async function me(req,res){
  const user = await User.findByPk(req.user.id, { attributes:['id','name','email','role'] })
  res.json(user)
}
