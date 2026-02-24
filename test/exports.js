import { expect } from 'chai'

import { Archiver, ZipArchive, TarArchive, JsonArchive } from '../index.js'
import DefaultExportCommonJs from '../index.cjs'

import ZipExport from '../zip/index.js'
import ZipExportCommonJs from '../zip/index.cjs'

describe('/', () => {
  it('should export ESM', () => {
    expect(Archiver).to.be.a('function')
    expect(ZipArchive).to.be.a('function')
    expect(TarArchive).to.be.a('function')
    expect(JsonArchive).to.be.a('function')
  })

  it(`should export CommonJS`, () => {
    expect(DefaultExportCommonJs.Archiver).to.be.a('function')
    expect(DefaultExportCommonJs.ZipArchive).to.be.a('function')
    expect(DefaultExportCommonJs.TarArchive).to.be.a('function')
    expect(DefaultExportCommonJs.JsonArchive).to.be.a('function')
  })
})

describe('/zip', () => {
  it('should export ESM', () => {
    expect(ZipExport).to.be.a('function')
  })

  it(`should export CommonJS`, () => {
    expect(ZipExportCommonJs).to.be.a('function')
  })
})