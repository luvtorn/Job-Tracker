import { prisma } from '@/lib/prisma';
import type { ContactInput, NoteInput, TagInput } from '@/server/validators/workspace-validator';

const emptyToNull = (value: string | null | undefined) => value === '' ? null : value;

export const workspaceRepository = {
  listContacts: (userId: string) => prisma.contact.findMany({ where: { userId }, orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
  createContact: (userId: string, data: ContactInput) => prisma.contact.create({ data: { userId, firstName: data.firstName, lastName: data.lastName, email: emptyToNull(data.email), phone: emptyToNull(data.phone), role: emptyToNull(data.role), notes: emptyToNull(data.notes) } }),
  updateContact: (id: string, userId: string, data: Partial<ContactInput>) => prisma.contact.updateMany({ where: { id, userId }, data: { ...data, email: emptyToNull(data.email), phone: emptyToNull(data.phone), role: emptyToNull(data.role), notes: emptyToNull(data.notes) } }),
  deleteContact: (id: string, userId: string) => prisma.contact.deleteMany({ where: { id, userId } }),

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
};
