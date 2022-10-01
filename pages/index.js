import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Renderer from "../components/renderer"

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>TITLE</title>
        <meta name="description" content="description" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          AAAAA
        </h1>

        <Renderer width="100%" height="100%"></Renderer>
      </main>
    </div>
  )
}
