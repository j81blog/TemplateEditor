import { describe, it, expect } from 'vitest'
import { parseXml } from '../../src/core/parser'

const MINIMAL_XML = `<?xml version="1.0" encoding="utf-8"?>
<Items>
  <SupportedOS>
    <OS>
      <Tag>Windows11</Tag>
      <Name>Windows 11</Name>
      <Abbreviation>W11</Abbreviation>
      <ServerOS>0</ServerOS>
      <Builds>
        <BuildStartsWith>21</BuildStartsWith>
        <BuildStartsWith>26</BuildStartsWith>
      </Builds>
    </OS>
    <OS>
      <Tag>Server2025</Tag>
      <Name>Windows Server 2025</Name>
      <Abbreviation>WS2025</Abbreviation>
      <ServerOS>1</ServerOS>
      <Builds>
        <BuildStartsWith>26</BuildStartsWith>
      </Builds>
    </OS>
  </SupportedOS>
  <Item>
    <Name>Test Service</Name>
    <Description>Disables WU</Description>
    <Type>Service</Type>
    <Category>Windows</Category>
    <Order>50</Order>
    <OS>
      <Windows11>
        <Execute>1</Execute>
        <Physical>1</Physical>
        <Virtual>0</Virtual>
      </Windows11>
    </OS>
    <Service>
      <Name>wuauserv</Name>
      <Action>Disabled</Action>
    </Service>
  </Item>
</Items>`

describe('parseXml — SupportedOS', () => {
  it('parses OS count', () => {
    expect(parseXml(MINIMAL_XML).supportedOs).toHaveLength(2)
  })

  it('parses client OS fields', () => {
    const os = parseXml(MINIMAL_XML).supportedOs[0]
    expect(os).toMatchObject({
      tag: 'Windows11',
      name: 'Windows 11',
      abbreviation: 'W11',
      isServerOs: false,
      buildStartsWith: ['21', '26']
    })
  })

  it('parses server OS flag', () => {
    const os = parseXml(MINIMAL_XML).supportedOs[1]
    expect(os.isServerOs).toBe(true)
  })
})

describe('parseXml — Item general fields', () => {
  it('parses name, description, category, order', () => {
    const item = parseXml(MINIMAL_XML).items[0]
    expect(item).toMatchObject({
      name: 'Test Service',
      description: 'Disables WU',
      type: 'Service',
      typeRaw: 'Service',
      category: 'Windows',
      order: 50
    })
  })

  it('assigns a non-empty id', () => {
    const item = parseXml(MINIMAL_XML).items[0]
    expect(item.id).toBeTruthy()
  })

  it('defaults order to 100 when missing', () => {
    const xml = MINIMAL_XML.replace('<Order>50</Order>', '')
    expect(parseXml(xml).items[0].order).toBe(100)
  })

  it('defaults order to 100 when non-numeric', () => {
    const xml = MINIMAL_XML.replace('<Order>50</Order>', '<Order>abc</Order>')
    expect(parseXml(xml).items[0].order).toBe(100)
  })
})

describe('parseXml — OS mapping', () => {
  it('parses Execute, Physical, Virtual', () => {
    const mapping = parseXml(MINIMAL_XML).items[0].os['Windows11']
    expect(mapping).toEqual({ execute: true, physical: true, virtual: false })
  })

  it('absent OS tag means not supported (key absent)', () => {
    const item = parseXml(MINIMAL_XML).items[0]
    expect(item.os['Server2025']).toBeUndefined()
  })

  it('Physical and Virtual default to false when elements absent', () => {
    const xml = MINIMAL_XML
      .replace('<Physical>1</Physical>', '')
      .replace('<Virtual>0</Virtual>', '')
    const mapping = parseXml(xml).items[0].os['Windows11']
    expect(mapping).toEqual({ execute: true, physical: false, virtual: false })
  })
})

describe('parseXml — Service payload', () => {
  it('parses service fields', () => {
    const item = parseXml(MINIMAL_XML).items[0]
    expect(item.payload).toMatchObject({ type: 'Service', name: 'wuauserv', action: 'Disabled' })
  })
})

describe('parseXml — Registry payload', () => {
  const XML = `<?xml version="1.0" encoding="utf-8"?>
<Items>
  <SupportedOS></SupportedOS>
  <Item>
    <Name>Reg Test</Name><Type>Registry</Type><Category>C</Category><Order>100</Order>
    <OS></OS>
    <Registry>
      <Hive>HKLM</Hive>
      <Path>SOFTWARE\\Test</Path>
      <Name>MyValue</Name>
      <Action>SetValue</Action>
      <Value>1</Value>
      <Type>DWord</Type>
    </Registry>
  </Item>
</Items>`

  it('parses registry payload', () => {
    const item = parseXml(XML).items[0]
    expect(item.payload).toMatchObject({
      type: 'Registry',
      hive: 'HKLM',
      path: 'SOFTWARE\\Test',
      name: 'MyValue',
      action: 'SetValue',
      value: '1',
      registryType: 'DWord'
    })
  })

  it('migrates legacy Delete action for named value', () => {
    const xml = XML.replace('<Action>SetValue</Action>', '<Action>Delete</Action>')
    const item = parseXml(xml).items[0]
    expect((item.payload as any).action).toBe('DeleteValue')
  })

  it('migrates legacy Delete action for unnamed value to DeleteKey', () => {
    const xml = XML
      .replace('<Action>SetValue</Action>', '<Action>Delete</Action>')
      .replace('<Name>MyValue</Name>', '<Name></Name>')
    const item = parseXml(xml).items[0]
    expect((item.payload as any).action).toBe('DeleteKey')
  })
})

describe('parseXml — PowerShell payload', () => {
  const XML = `<?xml version="1.0" encoding="utf-8"?>
<Items>
  <SupportedOS></SupportedOS>
  <Item>
    <Name>PS Test</Name><Type>PowerShell</Type><Category>C</Category><Order>100</Order>
    <OS></OS>
    <PowerShell>
      <Engine>pwsh</Engine>
      <Script><![CDATA[Write-Host "hello"]]></Script>
    </PowerShell>
  </Item>
</Items>`

  it('parses PowerShell engine and script', () => {
    const item = parseXml(XML).items[0]
    expect(item.payload).toMatchObject({
      type: 'PowerShell',
      engine: 'pwsh',
      script: 'Write-Host "hello"'
    })
  })
})

describe('parseXml — error handling', () => {
  it('throws on malformed XML', () => {
    expect(() => parseXml('<invalid<xml')).toThrow()
  })
})
