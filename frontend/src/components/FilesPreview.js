import React, { useEffect } from 'react'

import Tree, { TreeNode } from 'rc-tree'

const FilesPreview = ({ files, style }) => {
  useEffect(() => {
    console.log(files)
  }, [files])

  const filesList = files?.map(file => (
    <TreeNode
      title={file.name}
      key={file.path}
      isLeaf={file?.type === 'file'}
    ></TreeNode>
  ))

  return (
    <div style={style}>
      <h4>Files</h4>
      {files?.lenght === 0 ? <span>No files</span> : <Tree>{filesList}</Tree>}
    </div>
  )
}

export default FilesPreview
