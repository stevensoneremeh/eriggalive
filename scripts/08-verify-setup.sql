-- Check if users exist
SELECT COUNT(*) as user_count FROM users;

-- Check if categories exist  
SELECT COUNT(*) as category_count FROM community_categories;

-- Check if posts exist
SELECT COUNT(*) as post_count FROM community_posts;

-- Show sample data
SELECT 
    u.username,
    u.tier,
    u.coins,
    cp.content,
    cc.name as category
FROM community_posts cp
JOIN users u ON cp.user_id = u.id
JOIN community_categories cc ON cp.category_id = cc.id
LIMIT 3;
