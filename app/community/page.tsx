import { fetchCommunityPosts } from "@/lib/community-actions-final-fix"

async function CommunityPage() {
  const posts = await fetchCommunityPosts()

  return (
    <div>
      <h1>Community Page</h1>
      {posts.map((post) => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <p>Author: {post.authorId}</p>
        </div>
      ))}
    </div>
  )
}

export default CommunityPage
