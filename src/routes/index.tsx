import { Meta, Title } from '@solidjs/meta'
import Banner from '~/components/Banner'
import Main from '~/components/Main'
import { seoData, siteMetaData } from '~/data'

export default function Home() {
  return (
    <>
      <Title>{siteMetaData.title}</Title>
      <Meta name="description" content={siteMetaData.description} />
      <Meta name="keywords" content={seoData.keywords} />

      <Meta property="og:title" content={siteMetaData.ogTitle} />
      <Meta property="og:description" content={siteMetaData.ogDescription} />
      <Meta property="og:image" content={siteMetaData.ogImage} />
      <Meta property="og:site_name" content={siteMetaData.ogSiteName} />
      <Meta property="og:type" content={siteMetaData.ogType} />
      <Meta property="og:url" content={siteMetaData.ogUrl} />

      <Meta name="twitter:card" content={siteMetaData.twitterCard} />
      <Meta name="twitter:site" content={siteMetaData.twitterSite} />
      <Meta name="twitter:title" content={siteMetaData.twitterTitle} />
      <Meta name="twitter:description" content={siteMetaData.twitterDescription} />
      <Meta name="twitter:image" content={siteMetaData.twitterImage} />
      <Meta name="twitter:url" content={siteMetaData.twitterUrl} />

      <Meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <Meta name="author" content={seoData.mailAddress} />
      <Meta name="robots" content="index, follow" />
      <Meta name="theme-color" content="#A8E6CF" />

      <main class="bg-primary-100">
        <Banner />
        <Main />
      </main>
    </>
  )
}
