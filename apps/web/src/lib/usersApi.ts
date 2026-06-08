import type { CreateUserInput, UpdateUserInput, UserPublic } from '@caliper/shared';
import { api } from './api';

export async function listUsers(): Promise<UserPublic[]> {
  const { data } = await api.get<UserPublic[]>('/users');
  return data;
}
export async function createUser(input: CreateUserInput): Promise<UserPublic> {
  const { data } = await api.post<UserPublic>('/users', input);
  return data;
}
export async function updateUser(id: string, input: UpdateUserInput): Promise<UserPublic> {
  const { data } = await api.patch<UserPublic>(`/users/${id}`, input);
  return data;
}
