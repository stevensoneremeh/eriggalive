import { fetchCommunityPosts } from "@/lib/actions/community"

async function CommunityPage() {
  const posts = await fetchCommunityPosts()

  return (
    <div>
      <h1>Community Page</h1>
      {posts.length > 0 ? (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <h2>{post.title}</h2>
              <p>{post.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No posts yet.</p>
      )}
    </div>
  )
}

export default CommunityPage
