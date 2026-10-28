export async function rethrow<T>(promise: Promise<T>, message: string): Promise<T> {
  try {
    return await promise;
  } catch {
    throw new Error(message);
  }
}
