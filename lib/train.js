import { loadVectorStore, saveVectorStore } from '@/lib/vectorStore'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio'

export default async function train(dataUrls) {
  const trainingResult = []
  try {
    const vectorStore = await loadVectorStore()
    const executeAsyncOperation = (element) => {
      return new Promise(async (resolve) => {
        try {
          // Load LangChain's Cheerio Loader to parse the webpage
          const loader = new CheerioWebBaseLoader(element)
          const data = await loader.load()
          // Split the page into biggest chunks
          const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 3096,
            chunkOverlap: 128,
          })
          // Split the chunks into docs and train
          const tempSplitDocs = await textSplitter.splitDocuments(data)
          await vectorStore.addDocuments(tempSplitDocs)
          // Add to the global training array
          trainingResult.push({ name: element, trained: true })
          resolve()
        } catch (e) {
          // console.log('Faced error as below while training for', element)
          console.log(e.message || e.toString())
          trainingResult.push({ name: element, trained: false })
        }
      })
    }
    await Promise.all(dataUrls.map((element) => executeAsyncOperation(element)))
    await saveVectorStore(vectorStore)
  } catch (e) {
    console.log(e.message || e.toString())
  }
  console.table(trainingResult)
}
