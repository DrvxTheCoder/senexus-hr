import { redirect } from 'next/navigation';

export default async function Page() {
  // if (!userId) {
  //   return redirect('/auth/sign-in');
  // } else {
  //   redirect('/dashboard/overview');
  // }
  redirect('/dashboard/overview');
}
