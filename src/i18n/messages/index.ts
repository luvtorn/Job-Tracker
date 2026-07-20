import type { AppLocale } from '../config';
import en from './en';
import pl from './pl';
import ru from './ru';

type WidenMessages<T> = { [K in keyof T]: T[K] extends string ? string : T[K] extends object ? WidenMessages<T[K]> : T[K] };
export type AppMessages = WidenMessages<typeof en>;
export const messages = { en, pl, ru } satisfies Record<AppLocale, AppMessages>;
