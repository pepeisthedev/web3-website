import { ethers } from "ethers"

/**
 * Combines multiple SVG files into a single SVG for card generation
 * @param type - Card type (1-16)
 * @param frameId - Frame number (1-3)
 * @param cardId - Card ID (1-151)
 * @returns Combined SVG as string for use in img src
 */
export async function generateCardSvg(type: number, frameId: number, cardId: number): Promise<string> {
    try {
        // Fetch and process all SVG components
        const [typeSvg, frameSvg, beadSvg, textSvg, blob1Svg, blob2Svg, blob3Svg] = await Promise.all([
            getTypeSvg(type),
            getFrameSvg(frameId),
            getBeadSvg(cardId),
            getTextSvg(cardId),
            getBlobSvg(1),
            getBlobSvg(2),
            getBlobSvg(3)
        ]);

        // Combine all SVG content
        const combinedSvg = [
            "<?xml version='1.0' encoding='UTF-8'?><svg id='a' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 965.45 1332.29'>",
            typeSvg,
            frameSvg,
            beadSvg,
            textSvg,
            blob1Svg,
            blob2Svg,
            blob3Svg,
            "</svg>"
        ].join('');

        return combinedSvg;
    } catch (error) {
        console.error('Error generating card SVG:', error);
        throw new Error('Failed to generate card SVG');
    }
}

/**
 * Generates a data URI for the combined SVG that can be used directly in img src
 * @param type - Card type (1-16)
 * @param frameId - Frame number (1-3)
 * @param cardId - Card ID (1-151)
 * @returns Data URI string
 */
export async function generateCardSvgDataUri(type: number, frameId: number, cardId: number): Promise<string> {
    const svgContent = await generateCardSvg(type, frameId, cardId);
    const encodedSvg = encodeURIComponent(svgContent);
    return `data:image/svg+xml,${encodedSvg}`;
}

/**
 * Generates a bead SVG data URI directly from a card index (1-151)
 * @param cardIndex - Card index (1-151)
 * @returns Data URI string for the bead SVG
 */
export async function generateBeadSvgFromIndex(cardIndex: number): Promise<string> {
    try {
        // Validate index range
        if (cardIndex < 1 || cardIndex > 151) {
            throw new Error(`Invalid card index: ${cardIndex}. Must be between 1-151`);
        }

        // Fetch the complete bead SVG file
        const paddedNumber = cardIndex.toString().padStart(3, '0');
      //  const response = await fetch(`/images/svgs/beads151/${paddedNumber}.svg`);
        const response = await fetch(`/images/svgs/beads151/001.svg`);
        
        if (!response.ok) throw new Error(`Failed to fetch bead SVG: ${cardIndex}`);
        const svgContent = await response.text();

        // Remove transparent space by creating a cropped version
        const croppedSvg = cropSvgContent(svgContent);

        // Convert cropped SVG to data URI
        const base64 = btoa(croppedSvg);
        return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
        console.error('Error generating bead SVG from index:', error);
        throw new Error(`Failed to generate bead SVG from index: ${cardIndex}`);
    }
}

/**
 * Generates a bead SVG data URI from metadata
 * @param metadata - JSON metadata string (can be base64 encoded)
 * @returns Data URI string for the bead SVG only
 */
export async function generateCardSvgFromMetadata(metadata: string): Promise<string> {
    try {
        // Parse metadata (handle base64 if needed)
        let parsedMetadata;
        try {
            parsedMetadata = JSON.parse(metadata);
        } catch {
            // Try decoding base64 first
            const decoded = atob(metadata);
            parsedMetadata = JSON.parse(decoded);
        }

        const attributes = parsedMetadata.attributes || [];
        
        // Extract values from attributes
        const pokemonId = attributes.find((attr: any) => attr.trait_type === "Pokemon ID")?.value;
        const element = attributes.find((attr: any) => attr.trait_type === "Element")?.value;
        const frame = attributes.find((attr: any) => attr.trait_type === "Frame")?.value;

        if (!pokemonId || !element || !frame) {
            throw new Error('Missing required attributes in metadata');
        }

        // Convert to IDs
        const cardId = Number(pokemonId);
        const typeId = getElementTypeId(element);
        const frameId = getFrameId(frame);

        // Generate the SVG
       //return await generateCardSvg(typeId, frameId, cardId);
        return await generateCardSvg(2, 1, 1);
    } catch (error) {
        console.error('Error generating card SVG from metadata:', error);
        throw new Error('Failed to generate card SVG from metadata');
    }
}

/**
 * Generates a data URI for the combined SVG from metadata
 * @param metadata - JSON metadata string (can be base64 encoded)
 * @returns Data URI string
 */
export async function generateCardSvgDataUriFromMetadata(metadata: string): Promise<string> {
    const svgContent = await generateCardSvgFromMetadata(metadata);
    const encodedSvg = encodeURIComponent(svgContent);
    return `data:image/svg+xml,${encodedSvg}`;
}

/**
 * Generates metadata for the next evolution card
 * @param metadata - The current card metadata
 * @param characterStatsContract - The instantiated character stats contract
 * @returns Base64 encoded metadata for the next evolution card
 */
export async function generateCardMetadataForNextEvolution(
  metadata: string, 
  characterStatsContract: ethers.Contract
): Promise<string> {
  try {
    // Parse the base64 encoded JSON metadata
    const base64Data = metadata.replace('data:application/json;base64,', '');
    const jsonString = atob(base64Data);
    const data = JSON.parse(jsonString);

    // Extract current card info from metadata
    const currentCardId = parseInt(data.name.split('#')[1]);
    const frameId = data.attributes?.find((attr: any) => attr.trait_type === 'Frame')?.value || 1;

    // Get the next evolution card ID
    const nextEvolutionCardId = currentCardId + 1;

    // Get element type for the next evolution from the contract
    const elementType = await getElementTypeFromContract(nextEvolutionCardId, characterStatsContract);

    // Create new metadata object for the evolved card
    const evolvedMetadata = {
      ...data,
      name: `Bead151 #${nextEvolutionCardId.toString().padStart(3, '0')}`,
      attributes: [
        { trait_type: "Card", value: `Card #${nextEvolutionCardId}` },
        { trait_type: "Frame", value: frameId }, // Keep the same frame
        { trait_type: "Element", value: getElementNameFromType(elementType) }
      ]
    };

    // Convert back to base64 encoded metadata
    const evolvedJsonString = JSON.stringify(evolvedMetadata);
    const evolvedBase64 = btoa(evolvedJsonString);
    return `data:application/json;base64,${evolvedBase64}`;
  } catch (error) {
    console.error('Error generating evolved card metadata:', error);
    // Return original metadata if generation fails
    return metadata;
  }
}

/**
 * Helper function to convert element type number to element name
 * @param elementType - The element type number from contract
 * @returns The element name string
 */
function getElementNameFromType(elementType: number): string {
  const elementMap: Record<number, string> = {
    1: 'Grass',
    2: 'Water',
    3: 'Fire',
    4: 'Bug',
    5: 'Flying',
    6: 'Normal',
    7: 'Poison',
    8: 'Electric',
    9: 'Ground',
    10: 'Fairy',
    11: 'Fighting',
    12: 'Rock',
    13: 'Psychic',
    14: 'Ice',
    15: 'Ghost',
    16: 'Dragon'
  };
  
  return elementMap[elementType] || 'Normal';
}

/**
 * Helper function to get element type from character stats contract
 * @param cardId - Current card ID
 * @returns Element type number
 */
/**
 * Gets the element type for a character from the character stats contract
 * @param cardId - The card ID to get stats for
 * @param characterStatsContract - The instantiated character stats contract
 * @returns The element type number from the contract
 */
async function getElementTypeFromContract(cardId: number, characterStatsContract: ethers.Contract): Promise<number> {

    // Call getStats function
    const stats = await characterStatsContract.getStats(cardId);
    
    // Return the elementType (last element of the returned tuple)
    return Number(stats[4]);

}/**
 * Fetches and strips SVG content for type backgrounds
 */
async function getTypeSvg(type: number): Promise<string> {
    const paddedNumber = type.toString().padStart(3, '0');
    const response = await fetch(`/images/svgs/type-backgrounds/${paddedNumber}.svg`);
    if (!response.ok) throw new Error(`Failed to fetch type SVG: ${type}`);
    const svgContent = await response.text();
    return stripSvgWrapper(svgContent);
}

/**
 * Fetches and strips SVG content for frames
 */
async function getFrameSvg(frameId: number): Promise<string> {
    const paddedNumber = frameId.toString().padStart(3, '0');
    const response = await fetch(`/images/svgs/frames/${paddedNumber}.svg`);
    if (!response.ok) throw new Error(`Failed to fetch frame SVG: ${frameId}`);
    const svgContent = await response.text();
    return stripSvgWrapper(svgContent);
}

/**
 * Fetches and strips SVG content for beads
 */
async function getBeadSvg(cardId: number): Promise<string> {
    const paddedNumber = cardId.toString().padStart(3, '0');
    const response = await fetch(`/images/svgs/beads151/${paddedNumber}.svg`);
    if (!response.ok) throw new Error(`Failed to fetch bead SVG: ${cardId}`);
    const svgContent = await response.text();
    return stripSvgWrapper(svgContent);
}

/**
 * Fetches and strips SVG content for text
 */
async function getTextSvg(cardId: number): Promise<string> {
    const paddedNumber = cardId.toString().padStart(3, '0');
    const response = await fetch(`/images/svgs/texts/${paddedNumber}.svg`);
    if (!response.ok) throw new Error(`Failed to fetch text SVG: ${cardId}`);
    const svgContent = await response.text();
    return stripSvgWrapper(svgContent);
}

/**
 * Fetches and strips SVG content for blobs
 */
async function getBlobSvg(blobId: number): Promise<string> {
    const paddedNumber = blobId.toString().padStart(3, '0');
    const response = await fetch(`/images/svgs/blobs/${paddedNumber}.svg`);
    if (!response.ok) throw new Error(`Failed to fetch blob SVG: ${blobId}`);
    const svgContent = await response.text();
    return stripSvgWrapper(svgContent);
}

/**
 * Strips the XML declaration and outer SVG wrapper from SVG content
 * @param svgContent - Full SVG file content
 * @returns Inner SVG content without wrapper
 */
function stripSvgWrapper(svgContent: string): string {
    // Remove XML declaration and opening SVG tag
    let stripped = svgContent.replace(/^<\?xml[^>]*\?>/, '');
    stripped = stripped.replace(/<svg[^>]*>/, '');
    
    // Remove closing SVG tag
    stripped = stripped.replace(/<\/svg>$/, '');
    
    // Trim whitespace
    return stripped.trim();
}

/**
 * Type mappings for reference
 */
export const CARD_TYPES = {
    1: 'Grass',
    2: 'Water', 
    3: 'Fire',
    4: 'Bug',
    5: 'Flying',
    6: 'Normal',
    7: 'Poison',
    8: 'Electric',
    9: 'Ground',
    10: 'Fairy',
    11: 'Fighting',
    12: 'Rock',
    13: 'Psychic',
    14: 'Ice',
    15: 'Ghost',
    16: 'Dragon'
} as const;

/**
 * Frame mappings
 */
export const FRAME_TYPES = {
    1: 'Normal',
    2: 'Gold',
    3: 'Holo'
} as const;

/**
 * Converts element name to type ID
 * @param element - Element name (e.g., "Electric", "Water")
 * @returns Type ID (1-16)
 */
function getElementTypeId(element: string): number {
    const elementMap: Record<string, number> = {
        'Grass': 1,
        'Water': 2,
        'Fire': 3,
        'Bug': 4,
        'Flying': 5,
        'Normal': 6,
        'Poison': 7,
        'Electric': 8,
        'Ground': 9,
        'Fairy': 10,
        'Fighting': 11,
        'Rock': 12,
        'Psychic': 13,
        'Ice': 14,
        'Ghost': 15,
        'Dragon': 16
    };

    const typeId = elementMap[element];
    if (!typeId) {
        throw new Error(`Unknown element type: ${element}`);
    }
    return typeId;
}

/**
 * Converts frame name to frame ID
 * @param frame - Frame name (e.g., "Normal", "Gold", "Holo")
 * @returns Frame ID (1-3)
 */
function getFrameId(frame: string): number {
    const frameMap: Record<string, number> = {
        'Normal': 1,
        'Gold': 2,
        'Holo': 3
    };

    const frameId = frameMap[frame];
    if (!frameId) {
        throw new Error(`Unknown frame type: ${frame}`);
    }
    return frameId;
}

/**
 * Generates a simple bead SVG data URI from metadata (just the Pokemon image)
 * @param metadata - JSON metadata string (can be base64 encoded)
 * @returns Data URI string for the bead SVG only
 */
export async function generateBeadSvgFromMetadata(metadata: string): Promise<string> {
    try {
        // Parse metadata (handle base64 if needed)
        let parsedMetadata;
        try {
            parsedMetadata = JSON.parse(metadata);
        } catch {
            // Try decoding base64 first
            const decoded = atob(metadata);
            parsedMetadata = JSON.parse(decoded);
        }

        const attributes = parsedMetadata.attributes || [];
        
        // Extract Pokemon ID from attributes
        const pokemonId = attributes.find((attr: any) => attr.trait_type === "Pokemon ID")?.value;

        if (!pokemonId) {
            throw new Error('Missing Pokemon ID in metadata');
        }

        // Convert to number and fetch the complete bead SVG file
        const cardId = Number(pokemonId);
        const paddedNumber = cardId.toString().padStart(3, '0');
       // const response = await fetch(`/images/svgs/beads151/${paddedNumber}.svg`);
            const response = await fetch(`/images/svgs/beads151/001.svg`);
        if (!response.ok) throw new Error(`Failed to fetch bead SVG: ${cardId}`);
        const svgContent = await response.text();

        // Remove transparent space by creating a cropped version
        const croppedSvg = cropSvgContent(svgContent);

        // Convert cropped SVG to data URI
        const base64 = btoa(croppedSvg);
        return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
        console.error('Error generating bead SVG from metadata:', error);
        throw new Error('Failed to generate bead SVG from metadata');
    }
}

/**
 * Crops SVG content to remove transparent space around the visible content
 * @param svgContent - Original SVG content
 * @returns Cropped SVG with adjusted viewBox
 */
function cropSvgContent(svgContent: string): string {
    // For Pokemon bead SVGs, we can estimate the visible area is roughly centered
    // The original viewBox is typically "0 0 965.45 1332.29"
    // The Pokemon image is usually in the center area, so we can crop to that region
    
    // Replace the viewBox to focus on the center where the Pokemon image is
    // Approximate crop: center 60% of width and height
    const croppedViewBox = '193 300 579 575'; // Reduced height and moved down slightly
    
    // Try multiple regex patterns to catch different viewBox formats
    let croppedSvg = svgContent
        .replace(/viewBox="[^"]*"/g, `viewBox="${croppedViewBox}"`)
        .replace(/viewBox='[^']*'/g, `viewBox="${croppedViewBox}"`)
        .replace(/viewBox\s*=\s*"[^"]*"/g, `viewBox="${croppedViewBox}"`)
        .replace(/viewBox\s*=\s*'[^']*'/g, `viewBox="${croppedViewBox}"`);
    
    // Debug: log the replacement
   // console.log("Original SVG contains viewBox:", svgContent.includes('viewBox'));
  //  console.log("After replacement contains croppedViewBox:", croppedSvg.includes(croppedViewBox));
    
    // Also ensure we have proper SVG namespace
    if (!croppedSvg.includes('xmlns=')) {
        croppedSvg = croppedSvg.replace(
            '<svg',
            '<svg xmlns="http://www.w3.org/2000/svg"'
        );
    }
    
    return croppedSvg;
}

