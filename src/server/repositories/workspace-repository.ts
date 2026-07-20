import { prisma } from '@/lib/prisma';
import type { CompanyInput, ContactInput, NoteInput, ReminderInput, ReminderUpdate, TagInput } from '@/server/validators/workspace-validator';

const emptyToNull = (value: string | null | undefined) => value === '' ? null : value;

export const workspaceRepository = {
  listCompanies: (userId: string) => prisma.company.findMany({ where: { userId }, include: { _count: { select: { contacts: true } } }, orderBy: { name: 'asc' } }),
  createCompany: (userId: string, data: CompanyInput) => prisma.company.create({ data: { userId, name: data.name, website: emptyToNull(data.website), location: emptyToNull(data.location), notes: emptyToNull(data.notes) } }),
  updateCompany: (id: string, userId: string, data: Partial<CompanyInput>) => prisma.company.updateMany({ where: { id, userId }, data: { ...data, website: emptyToNull(data.website), location: emptyToNull(data.location), notes: emptyToNull(data.notes) } }),
  deleteCompany: (id: string, userId: string) => prisma.company.deleteMany({ where: { id, userId } }),

  listContacts: (userId: string) => prisma.contact.findMany({ where: { userId }, include: { company: { select: { id: true, name: true } } }, orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
  createContact: (userId: string, data: ContactInput) => prisma.contact.create({ data: { userId, firstName: data.firstName, lastName: data.lastName, email: emptyToNull(data.email), phone: emptyToNull(data.phone), role: emptyToNull(data.role), notes: emptyToNull(data.notes), companyId: data.companyId } }),
  updateContact: (id: string, userId: string, data: Partial<ContactInput>) => prisma.contact.updateMany({ where: { id, userId }, data: { ...data, email: emptyToNull(data.email), phone: emptyToNull(data.phone), role: emptyToNull(data.role), notes: emptyToNull(data.notes) } }),
  deleteContact: (id: string, userId: string) => prisma.contact.deleteMany({ where: { id, userId } }),
  ownsCompany: (id: string, userId: string) => prisma.company.count({ where: { id, userId } }),

  listNotes: (userId: string) => prisma.applicationNote.findMany({ where: { userId }, include: { application: { select: { id: true, vacancy: { select: { title: true, company: true } } } } }, orderBy: { updatedAt: 'desc' } }),
  createNote: (userId: string, data: NoteInput) => prisma.applicationNote.create({ data: { userId, ...data }, include: { application: { select: { id: true, vacancy: { select: { title: true, company: true } } } } } }),
  updateNote: (id: string, userId: string, content: string) => prisma.applicationNote.updateMany({ where: { id, userId }, data: { content } }),
  deleteNote: (id: string, userId: string) => prisma.applicationNote.deleteMany({ where: { id, userId } }),
  ownsApplication: (id: string, userId: string) => prisma.application.count({ where: { id, userId } }),

  listTags: (userId: string) => prisma.tag.findMany({ where: { userId }, include: { _count: { select: { applications: true } } }, orderBy: { name: 'asc' } }),
  createTag: (userId: string, data: TagInput) => prisma.tag.create({ data: { userId, ...data } }),
  updateTag: (id: string, userId: string, data: Partial<TagInput>) => prisma.tag.updateMany({ where: { id, userId }, data }),
  deleteTag: (id: string, userId: string) => prisma.tag.deleteMany({ where: { id, userId } }),
  ownsTag: (id: string, userId: string) => prisma.tag.count({ where: { id, userId } }),
  attachTag: (applicationId: string, tagId: string) => prisma.applicationTag.upsert({ where: { applicationId_tagId: { applicationId, tagId } }, create: { applicationId, tagId }, update: {} }),
  detachTag: (applicationId: string, tagId: string) => prisma.applicationTag.deleteMany({ where: { applicationId, tagId } }),

  listReminders: (userId: string) => prisma.reminder.findMany({ where: { userId }, include: { application: { select: { id: true, vacancy: { select: { title: true, company: true } } } } }, orderBy: { dueAt: 'asc' } }),
  createReminder: (userId: string, data: ReminderInput) => prisma.reminder.create({ data: { userId, ...data }, include: { application: { select: { id: true, vacancy: { select: { title: true, company: true } } } } } }),
  updateReminder: (id: string, userId: string, data: Omit<ReminderUpdate, 'completed'> & { completedAt?: Date | null }) => prisma.reminder.updateMany({ where: { id, userId }, data }),
  deleteReminder: (id: string, userId: string) => prisma.reminder.deleteMany({ where: { id, userId } }),
};
