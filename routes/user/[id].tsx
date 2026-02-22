/**
 * User detail page
 * Dynamic route: /user/:id
 */

/** User page props */
interface UserProps {
  /** Route params */
  params: {
    id: string;
  };
}

/** Mock user data */
const users: Record<string, { name: string; email: string; role: string }> = {
  "1": { name: "John", email: "user1@example.com", role: "Admin" },
  "2": { name: "Jane", email: "user2@example.com", role: "User" },
  "3": { name: "Bob", email: "user3@example.com", role: "Guest" },
};

/**
 * User detail page
 */
export default function User({ params }: UserProps) {
  const user = users[params.id];

  if (!user) {
    return (
      <div className="py-16 px-5 text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-500">User not found</h1>
        <p className="mb-4">User ID: {params.id} does not exist</p>
        <a
          href="/"
          className="mt-5 inline-block rounded-md bg-blue-600 px-5 py-2.5 text-white no-underline hover:bg-blue-700"
        >
          Back to home
        </a>
      </div>
    );
  }

  return (
    <div className="py-5">
      <h1 className="mb-8 text-3xl font-bold">User detail</h1>

      <div className="flex items-center gap-6 rounded-xl bg-white p-8 shadow-md">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-3xl font-bold text-white">
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 className="mb-2 text-2xl font-semibold">{user.name}</h2>
          <p className="mb-2.5 text-gray-600">{user.email}</p>
          <span className="inline-block rounded-full bg-indigo-500 px-3 py-1 text-sm text-white">
            {user.role}
          </span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <a
          href="/user/1"
          className="rounded-md bg-gray-100 px-5 py-2.5 text-gray-800 no-underline transition-colors hover:bg-gray-200"
        >
          User 1
        </a>
        <a
          href="/user/2"
          className="rounded-md bg-gray-100 px-5 py-2.5 text-gray-800 no-underline transition-colors hover:bg-gray-200"
        >
          User 2
        </a>
        <a
          href="/user/3"
          className="rounded-md bg-gray-100 px-5 py-2.5 text-gray-800 no-underline transition-colors hover:bg-gray-200"
        >
          User 3
        </a>
      </div>
    </div>
  );
}
