const router = require("express").Router();
const { ethers } = require("ethers");
const puppeteer = require("puppeteer");
const pinataSDK = require("@pinata/sdk");
const { Readable } = require("stream");
const fs = require("fs");
// Read the SVG file
const svgCode = fs.readFileSync("./src/academix.svg", "utf-8");

require("dotenv").config();

// Contract ABI (Application Binary Interface)
const { academixNFTABI } = require("./academixnft-abi");
const response = require("./response");

/* 
  NB: I used polygon mumbai, 
  so make sure to deploy your contract on mumbai testnet 
*/

function getContract() {
// Mumbai testnet configuration: Quicknode endpoint and Private Key
  const { QUICKNODE_API_KEY_URL, PRIVATE_KEY } = process.env;

// Deployed contract address
  const contractAddress = "0x15D768cdFB23390be9fFd1D950aE48190a70a901";

  const provider = new ethers.providers.JsonRpcProvider(QUICKNODE_API_KEY_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const contract = new ethers.Contract(contractAddress, academixNFTABI, wallet);

  return contract;
}


// HTML Document for the Certificate
async function generateHTML(variables) {
  const { name, course, issueDate } = variables;
  const html = `
  <!DOCTYPE html>
<html>

<head>
  <style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f8f8f8;
    padding: 0 40px;
    display: flex;
    justify-content: center;
    align-items: center;

  }

  .main {
    border: 10px solid #5A189A;
    margin: 2px;
    padding: 20px;
    height: 600px;
    width: 900px;
    background: #FCFAF8;

  }

  .childDiv {
    border: 2px solid #EBCE87;
    height: 590px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .details {
    border: none;
    text-align: center;

  }


  h1 {
    font-size: 45px;
    margin-bottom: 10px;
  }

  h2 {
    font-size: 38px;
    margin-bottom: 8px;
  }

  h3 {
    font-size: 30px;
    margin-bottom: 8px;
  }

  h4 {
    font-size: 26px;
    margin-bottom: 18px;
  }

  p {
    font-size: 22px;
    font-style: italic;
  }
  </style>
</head>

<body>
  <div class="main">
    <div class="childDiv">

      <div class="details">
        <h1>Certificate of Completion</h1>
        <p>This is to certify that</p>
        <h2>${name}</h2>
        <p>has completed the Course</p>
        <h3>${course}</h3>
        <p>On the</p>
        <h4>${issueDate}</h4>
         <div class="svg">
      ${svgCode}
    </div>
      </div>
    </div>
  </div>
</body>

</html>`;

  return html;
}

// Handles the HTML document Screenshot
async function createHTMLCertificate(name, course, issueDate) {
  try {
// Create a dynamic HTML string for the certificate
    const html = await generateHTML({ name, course, issueDate });

// Launch a new browser instance
const browser = await puppeteer.launch({
  executablePath:
    process.env.NODE_ENV === "production"
      ? process.env.PUPPETEER_EXECUTABLE_PATH
      : puppeteer.executablePath(),
  timeout: 60000, // Set a higher timeout value
});
    const page = await browser.newPage();

// Set the HTML content of the page
    await page.setContent(html);

// Set a custom viewport size for the page
    await page.setViewport({
      width: 1000, // Set the width as per your requirements
      height: 680, // Set the height as per your requirements
    });

// Take a screenshot and save it as a PNG, using clip to crop the image if needed
    const screenshot = await page.screenshot();

// Close the browser
    await browser.close();

    return screenshot;
  } catch (error) {
    console.log(error);
  }
}


// Saves the Screenshot and the metadata to PINATA

async function saveToPinata(file, data) {
  try {
// Initialize the Pinata client
    const { PINATA_API_KEY, PINATA_API_SECRET } = process.env;
    const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);

// Convert the screenshot buffer to a ReadableStream
    const readableStreamForFile = new Readable();
    readableStreamForFile.push(file);
    readableStreamForFile.push(null);

// Upload the image file to Pinata
    const imageResult = await pinata.pinFileToIPFS(readableStreamForFile, {
      pinataMetadata: { name: `Certificate of Completion for ${data.name}` },
    });
    const imageURL = `https://gateway.pinata.cloud/ipfs/${imageResult.IpfsHash}`;

// Create a metadata object for OpenSea to read from
    const metadata = {
      name: `Certificate of Completion for ${data.name}`,
      description: `This is a certificate of completion for the course: ${data.course}`,
      image: imageURL,
      attributes: [{ trait_type: "Course", value: data.course }],
    };

// Convert the metadata object to a JSON string
    const metadataJSON = JSON.stringify(metadata);

// Convert the metadata JSON string to a buffer
    const metadataBuffer = Buffer.from(metadataJSON);

// Convert the metadata buffer to a ReadableStream
    const readableStreamForMetadata = new Readable();
    readableStreamForMetadata.push(metadataBuffer);
    readableStreamForMetadata.push(null);

// Upload the metadata file to Pinata
    const metadataResult = await pinata.pinFileToIPFS(
      readableStreamForMetadata,
      {
        pinataMetadata: { name: `Metadata for ${imageResult.IpfsHash}` },
      }
    );

// Return the direct metadata URL
    return `https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`;
  } catch (error) {
    console.log(error);
  }
}

module.exports = function () {
  router.post("/certificates", async (req, res) => {
    const certificate = req.body;
    const issueDate = new Date().toDateString();
    certificate.issueDate = issueDate;

    console.log(certificate);

    const file = await createHTMLCertificate(
      certificate.name,
      certificate.course,
      certificate.issueDate
    );

// This now holds the tokenURI (metadata URL), not the image URL
    const tokenURI = await saveToPinata(file, certificate);

    console.log({ tokenURI });

    const contract = getContract();
    const gasEstimate = await contract.estimateGas.mintNFT(
      certificate.receipient,
      tokenURI
    );

    const transactionResponse = await contract.mintNFT(
      certificate.receipient,
      tokenURI,
      { gasLimit: Math.round(gasEstimate * 1.1) }
    );

// Wait for the transaction to be mined
    await transactionResponse.wait(); 

    res.send(response("Certificate NFT Minted successfully", certificate));
  });

  return router;
};
