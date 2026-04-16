import fs from "fs"
const cleanupLocalFiles = (localPath) => {
    fs.unlinkSync(localPath)
}

export {cleanupLocalFiles}