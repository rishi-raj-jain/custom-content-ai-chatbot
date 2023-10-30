import { join } from 'path'
import { existsSync } from 'fs'
import { Document } from 'langchain/document'
import { FaissStore } from 'langchain/vectorstores/faiss'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'

export async function loadVectorStore() {
  const directory = join(process.cwd(), 'loadedVectorStore')
  const docStoreJSON = join(process.cwd(), 'loadedVectorStore', 'docstore.json')
  if (existsSync(docStoreJSON)) {
    // If the directory is found, load the vector store saved by Faiss integration
    return await FaissStore.load(directory, new OpenAIEmbeddings())
  } else {
    // If no content is there, load the vector store with just `Hey` for starters
    return await FaissStore.fromDocuments([new Document({ pageContent: 'Hey' })], new OpenAIEmbeddings())
  }
}

export async function saveVectorStore(vectorStore) {
  const directory = join(process.cwd(), 'loadedVectorStore')
  await vectorStore.save(directory)
}
