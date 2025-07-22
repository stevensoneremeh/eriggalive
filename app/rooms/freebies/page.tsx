'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Play, Trophy, Gamepad2, MessageSquare, TrendingUp } from 'lucide-react'
import LudoGame from '@/components/games/ludo-game'

const freeDownloads = [
  {
    id: 1,
    title: 'Erigga - Free Beat Pack Vol. 1',
    type: 'Audio',
    size: '45 MB',
    downloads: 1234,
    description: 'Collection of free beats for upcoming artists'
  },
  {
    id: 2,
    title: 'Behind The Scenes - Studio Session',
    type: 'Video',
    size: '120 MB',
    downloads: 892,
    description: 'Exclusive behind the scenes footage'
  },
  {
    id: 3,
    title: 'Erigga Wallpaper Pack',
    type: 'Images',
    size: '15 MB',
    downloads: 2156,
    description: 'High-quality wallpapers for your devices'
  }
]

const communityPosts = [
  {
    id: 1,
    author: 'MusicFan123',
    content: 'Just downloaded the new beat pack! Fire tracks 🔥',
    likes: 45,
    comments: 12,
    time: '2 hours ago'
  },
  {
    id: 2,
    author: 'ProducerLife',
    content: 'Used one of the free beats for my new track. Thanks Erigga! 🙏',
    likes: 78,
    comments: 23,
    time: '5 hours ago'
  },
  {
    id: 3,
    author: 'HipHopHead',
    content: 'The wallpapers are sick! Using them on all my devices now.',
    likes: 34,
    comments: 8,
    time: '1 day ago'
  }
]

const leaderboard = [
  { rank: 1, name: 'GameMaster2024', coins: 15420, games: 156 },
  { rank: 2, name: 'LudoKing', coins: 12890, games: 134 },
  { rank: 3, name: 'DiceRoller', coins: 11250, games: 128 },
  { rank: 4, name: 'BoardGamePro', coins: 9870, games: 112 },
  { rank: 5, name: 'You', coins: 1000, games: 0 }
]

export default function FreebiesPage() {
  const [activeTab, setActiveTab] = useState('downloads')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Freebies Room</h1>
        <p className="text-muted-foreground">
          Free downloads, games, and community discussions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="downloads" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Downloads
          </TabsTrigger>
          <TabsTrigger value="games" className="flex items-center">
            <Gamepad2 className="h-4 w-4 mr-2" />
            Games
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Community
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center">
            <Trophy className="h-4 w-4 mr-2" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="downloads" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeDownloads.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{item.type}</Badge>
                    <Badge variant="outline">{item.size}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {item.downloads.toLocaleString()} downloads
                    </span>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="games" className="space-y-6">
          <LudoGame />
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communityPosts.map((post) => (
                  <div key={post.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{post.author}</span>
                      <span className="text-sm text-muted-foreground">{post.time}</span>
                    </div>
                    <p className="text-sm mb-3">{post.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <button className="flex items-center hover:text-primary">
                        <span>👍 {post.likes}</span>
                      </button>
                      <button className="flex items-center hover:text-primary">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {post.comments}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Game Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((player) => (
                  <div 
                    key={player.rank} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.name === 'You' ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        player.rank === 1 ? 'bg-yellow-500 text-white' :
                        player.rank === 2 ? 'bg-gray-400 text-white' :
                        player.rank === 3 ? 'bg-amber-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {player.rank}
                      </div>
                      <div>
                        <p className="font-semibold">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {player.games} games played
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{player.coins.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">coins</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
