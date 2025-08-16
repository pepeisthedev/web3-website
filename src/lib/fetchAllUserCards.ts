import { ethers } from "ethers"
import cardContractABI from "../assets/abi/Bead151Card.json"

export interface CardData {
  tokenId: number
  cardId: number
  metadata: string
}
const cardContractAddress = import.meta.env.VITE_BEAD151_CARD_CONTRACT

export async function fetchAllUserCards(
  userAddress: string,
  walletProvider: any,
): Promise<CardData[]> {
  console.log("🔍 Fetching user collection for address:", userAddress)

  if (!walletProvider || !userAddress) {
    console.log("❌ No wallet provider or address")
    return []
  }

  const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
  const cardContract = new ethers.Contract(cardContractAddress, cardContractABI, ethersProvider)

  try {
    console.log("📋 Getting user cards from contract...")
    const [tokenIds, cardIds] = await cardContract.getUserCards(userAddress)

    if (cardIds.length === 0) {
      console.log("📭 User has no cards")
      return []
    }

   // console.log("Owned token IDs: ", tokenIds)
   // console.log("Owned card IDs: ", cardIds)

    const cardIdsArray = Array.from(cardIds).map((id: any) => Number(id))
    const tokenIdsArray = Array.from(tokenIds).map((id: any) => Number(id))

    const metadataArray = await cardContract.metadata(tokenIdsArray)
   // console.log("📋 Metadata fetched for token IDs:", tokenIdsArray)

    // Helper to decode base64 data:application/json;base64,...
    function decodeBase64Json(dataUri: string): string {
      if (!dataUri.startsWith('data:application/json;base64,')) return dataUri
      try {
        const base64 = dataUri.replace('data:application/json;base64,', '')
        const json = atob(base64)
        return json
      } catch (e) {
        return dataUri
      }
    }

    const allCardData: CardData[] = cardIdsArray.map((cardId: number, index: number) => {
      return {
        tokenId: tokenIdsArray[index],
        cardId: cardId,
        metadata: decodeBase64Json(metadataArray[index]),
      }
    })
    console.log("✅ Card data loaded from contract metadata")
    console.log("🎯 Collection processed:", allCardData.length, "cards")
    return allCardData
  } catch (error) {
    console.error('❌ Error fetching all user cards:', error)
    return []
  }
}
