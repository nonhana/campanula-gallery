import type { WorkItem } from '~/types'

export const bannerInfo = {
  name: '待夕归明',
  description: '我和我沉寂的灵魂，伴有十一月的初雪...',
}

export const seoData = {
  title: 'Campanulas',
  ogTitle: 'Some melodies just for venting',
  description: 'The piano keys dance with the petals.',
  keywords: '钢琴, 音乐, 随弹, 钢琴曲, 钢琴演奏, 钢琴独奏, 纯音乐',
  image: 'https://static-r2.caelum.moe/campanula-gallery.webp',
  mySite: 'https://gallery.caelum.moe',
  twitterHandle: '@non_hanaz',
  mailAddress: 'zhouxiang757@gmail.com',
}

export const siteMetaData = {
  title: seoData.title,
  ogTitle: seoData.ogTitle,
  description: seoData.description,

  // Test on: https://developers.facebook.com/tools/debug/ or https://socialsharepreview.com/
  ogDescription: seoData.description,
  ogImage: seoData.image,
  ogSiteName: seoData.mySite,
  ogType: 'website',
  ogUrl: seoData.mySite,

  // Test on: https://cards-dev.twitter.com/validator or https://socialsharepreview.com/
  twitterSite: seoData.twitterHandle,
  twitterCard: 'summary_large_image',
  twitterUrl: seoData.mySite,
  twitterTitle: seoData.ogTitle,
  twitterDescription: seoData.description,
  twitterImage: seoData.image,
} as const

export const publishedWorks: WorkItem[] = [
  {
    title: '夏の夕焼け',
    album: {
      name: '夏の夕焼け',
      cover: 'https://static-r2.caelum.moe/%E5%A4%8F%E3%81%AE%E5%A4%95%E7%84%BC%E3%81%91.jpg',
      description: 'pid: 72006268',
    },
    source: 'https://static-r2.caelum.moe/%E5%BE%85%E5%A4%95%E5%BD%92%E6%98%8E%20-%20%E5%A4%8F%E3%81%AE%E5%A4%95%E7%84%BC%E3%81%91.mp3',
    total_seconds: 259,
  },
  {
    title: 'I\'ll send some notes for your poems.',
    album: {
      name: '一些随弹',
      cover: 'https://static-r2.caelum.moe/%E4%B8%80%E4%BA%9B%E9%9A%8F%E5%BC%B9.jpg',
      description: '没事干的时候，拿起琴写下一些东西......',
    },
    source: 'https://static-r2.caelum.moe/%E5%BE%85%E5%A4%95%E5%BD%92%E6%98%8E%20-%20I\'ll%20send%20some%20notes%20for%20your%20poems.mp3',
    total_seconds: 184,
  },
  {
    title: 'memories are still echoing.',
    album: {
      name: '一些随弹',
      cover: 'https://static-r2.caelum.moe/%E4%B8%80%E4%BA%9B%E9%9A%8F%E5%BC%B9.jpg',
      description: '没事干的时候，拿起琴写下一些东西......',
    },
    source: 'https://static-r2.caelum.moe/%E5%BE%85%E5%A4%95%E5%BD%92%E6%98%8E%20-%20memories%20are%20still%20echoing.mp3',
    total_seconds: 334,
  },
  {
    title: '夕落',
    album: {
      name: 'dusk will befall with you.',
      cover: 'https://static-r2.caelum.moe/dusk%20will%20befall%20with%20you..jpg',
      description: '专辑封面：https://www.pixiv.net/artworks/93490869',
    },
    source: 'https://static-r2.caelum.moe/%E5%BE%85%E5%A4%95%E5%BD%92%E6%98%8E%20-%20%E5%A4%95%E8%90%BD.mp3',
    total_seconds: 326,
  },
  {
    title: '暮秋的遐思',
    album: {
      name: 'last autumn.',
      cover: 'https://static-r2.caelum.moe/last%20autumn..jpg',
      description: '封面：https://www.pixiv.net/artworks/94263720',
    },
    source: 'https://static-r2.caelum.moe/%E5%BE%85%E5%A4%95%E5%BD%92%E6%98%8E%20-%20%E6%9A%AE%E7%A7%8B%E7%9A%84%E9%81%90%E6%80%9D.mp3',
    total_seconds: 241,
  },
  {
    title: 'Sugar Life',
    album: {
      name: 'Sugar Life',
      cover: 'https://static-r2.caelum.moe/Suger%20Life.jpg',
      description: '看完 Happy Sugar Life 之后，很自然脑海中浮现出的旋律。\n\n盐酱和砂糖之间变态一般的羁绊，我十分的向往。与其说这是病娇之间的共鸣，我更愿意相信是孤独之人相互吸引的温柔的故事。人们是无法忍受孤独的，再坚强的人也会被长久孤独彻底腐蚀。因此我们渴望人与人之间的羁绊，渴望建立起所谓的“永恒的情谊”。\n\n两个被自己所爱之人抛弃的孤独之人、无法正确理解感情为何物的人相互救赎——这是献给世界上孤独之人的一段物语。\n\n最后两个人在高楼上殉情，盐酱成为了下一个砂糖。\n\n“砂糖酱，今晚也一起看星星吧。这装满幸福的玻璃瓶，我会永远守护到底的哦。”',
    },
    source: 'https://static-r2.caelum.moe/%E5%BE%85%E5%A4%95%E5%BD%92%E6%98%8E%20-%20Sugar%20life.mp3',
    total_seconds: 170,
  },
  {
    title: '落雨随弹',
    album: {
      name: '落雨随弹',
      cover: 'https://static-r2.caelum.moe/%E8%90%BD%E9%9B%A8%E9%9A%8F%E5%BC%B9.jpg',
      description: '封面pid：66385385',
    },
    source: 'https://static-r2.caelum.moe/%E5%BE%85%E5%A4%95%E5%BD%92%E6%98%8E%20-%20%E8%90%BD%E9%9B%A8%E9%9A%8F%E5%BC%B9.mp3',
    total_seconds: 171,
  },
  {
    title: 'Grey Flowers',
    album: {
      name: '黒鳥璃水',
      cover: 'https://static-r2.caelum.moe/%E9%BB%92%E9%B3%A5%E7%92%83%E6%B0%B4.jpg',
      description: '我想去一遍西伯利亚的最东边。',
    },
    source: 'https://static-r2.caelum.moe/%E5%BE%85%E5%A4%95%E5%BD%92%E6%98%8E%20-%20Grey%20Flowers.mp3',
    total_seconds: 277,
  },
]
