import { Prisma } from '@prisma/client';
import { conflict, forbidden, notFound } from '@/server/errors/application-error';
import { workspaceRepository } from '@/server/repositories/workspace-repository';
import type { CompanyInput, ContactInput, NoteInput, ReminderInput, ReminderUpdate, TagInput } from '@/server/validators/workspace-validator';
import { getReminderGroup } from '@/server/services/reminder-grouping';

const assertChanged = (count: number, resource: string) => { if (!count) throw notFound(`${resource} not found`); };
const assertApplication = async (applicationId: string, userId: string) => { if (!await workspaceRepository.ownsApplication(applicationId, userId)) throw forbidden('You cannot use this application'); };
const isUniqueConflict = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

export const workspaceService = {
  listCompanies: workspaceRepository.listCompanies,
  createCompany: async (userId: string, data: CompanyInput) => { try { return await workspaceRepository.createCompany(userId, data); } catch (error) { if (isUniqueConflict(error)) throw conflict('A company with this name already exists'); throw error; } },
  updateCompany: async (id: string, userId: string, data: Partial<CompanyInput>) => assertChanged((await workspaceRepository.updateCompany(id, userId, data)).count, 'Company'),
  deleteCompany: async (id: string, userId: string) => assertChanged((await workspaceRepository.deleteCompany(id, userId)).count, 'Company'),
  listContacts: workspaceRepository.listContacts,
  createContact: async (userId: string, data: ContactInput) => { if (data.companyId && !await workspaceRepository.ownsCompany(data.companyId, userId)) throw forbidden('You cannot use this company'); return workspaceRepository.createContact(userId, data); },
  updateContact: async (id: string, userId: string, data: Partial<ContactInput>) => { if (data.companyId && !await workspaceRepository.ownsCompany(data.companyId, userId)) throw forbidden('You cannot use this company'); assertChanged((await workspaceRepository.updateContact(id, userId, data)).count, 'Contact'); },
  deleteContact: async (id: string, userId: string) => assertChanged((await workspaceRepository.deleteContact(id, userId)).count, 'Contact'),
  listNotes: workspaceRepository.listNotes,
  createNote: async (userId: string, data: NoteInput) => { await assertApplication(data.applicationId, userId); return workspaceRepository.createNote(userId, data); },
  updateNote: async (id: string, userId: string, content: string) => assertChanged((await workspaceRepository.updateNote(id, userId, content)).count, 'Note'),
  deleteNote: async (id: string, userId: string) => assertChanged((await workspaceRepository.deleteNote(id, userId)).count, 'Note'),
  listTags: workspaceRepository.listTags,
  createTag: async (userId: string, data: TagInput) => { try { return await workspaceRepository.createTag(userId, data); } catch (error) { if (isUniqueConflict(error)) throw conflict('A tag with this name already exists'); throw error; } },
  updateTag: async (id: string, userId: string, data: Partial<TagInput>) => assertChanged((await workspaceRepository.updateTag(id, userId, data)).count, 'Tag'),
  deleteTag: async (id: string, userId: string) => assertChanged((await workspaceRepository.deleteTag(id, userId)).count, 'Tag'),
  attachTag: async (userId: string, applicationId: string, tagId: string) => { await assertApplication(applicationId, userId); if (!await workspaceRepository.ownsTag(tagId, userId)) throw forbidden('You cannot use this tag'); return workspaceRepository.attachTag(applicationId, tagId); },
  detachTag: async (userId: string, applicationId: string, tagId: string) => { await assertApplication(applicationId, userId); if (!await workspaceRepository.ownsTag(tagId, userId)) throw forbidden('You cannot use this tag'); return workspaceRepository.detachTag(applicationId, tagId); },
  async listReminders(userId: string) { const reminders = await workspaceRepository.listReminders(userId); return reminders.map((reminder) => ({ ...reminder, group: getReminderGroup(reminder.dueAt, reminder.completedAt) })); },
  createReminder: async (userId: string, data: ReminderInput) => { if (data.applicationId) await assertApplication(data.applicationId, userId); return workspaceRepository.createReminder(userId, data); },
  updateReminder: async (id: string, userId: string, data: ReminderUpdate) => { if (data.applicationId) await assertApplication(data.applicationId, userId); const { completed, ...values } = data; assertChanged((await workspaceRepository.updateReminder(id, userId, { ...values, ...(completed === undefined ? {} : { completedAt: completed ? new Date() : null }) })).count, 'Reminder'); },
  deleteReminder: async (id: string, userId: string) => assertChanged((await workspaceRepository.deleteReminder(id, userId)).count, 'Reminder'),
};
