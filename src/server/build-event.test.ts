import { describe, expect, it } from 'vitest'
import { buildServerEvent } from './build-event.js'

describe('buildServerEvent', () => {
  it('maps the flat wire payload into a ServerEvent', () => {
    const event = buildServerEvent(
      {
        eventName: 'Purchase',
        eventId: 'order-1',
        eventSourceUrl: 'https://shop.example/thankyou',
        emails: ['a@b.com'],
        value: 99.99,
        currency: 'USD',
        contents: [{ id: 'sku-1', quantity: 1, item_price: 99.99 }],
      },
      {
        clientIpAddress: '1.2.3.4',
        clientUserAgent: 'UA',
        fbp: 'fb.1.x.y',
        fbc: undefined,
        referrerUrl: 'https://google.com/',
      },
    )

    expect(event.eventName).toBe('Purchase')
    expect(event.eventId).toBe('order-1')
    expect(event.eventSourceUrl).toBe('https://shop.example/thankyou')
    expect(event.actionSource).toBe('website')
    expect(event.userData?.emails).toEqual(['a@b.com'])
    expect(event.userData?.clientIpAddress).toBe('1.2.3.4')
    expect(event.userData?.fbp).toBe('fb.1.x.y')
    expect(event.customData?.value).toBe(99.99)
    expect(event.customData?.currency).toBe('USD')
    expect(event.customData?.contents).toHaveLength(1)
    expect(event.referrerUrl).toBe('https://google.com/')
  })

  it('prefers payload referrerUrl over the Referer header', () => {
    const event = buildServerEvent(
      { eventName: 'PageView', eventId: 'e1', referrerUrl: 'https://client-supplied.test/' },
      {
        clientIpAddress: undefined,
        clientUserAgent: undefined,
        fbp: undefined,
        fbc: undefined,
        referrerUrl: 'https://from-header.test/',
      },
    )
    expect(event.referrerUrl).toBe('https://client-supplied.test/')
  })

  it('threads messaging / app identity user-data fields', () => {
    const event = buildServerEvent(
      {
        eventName: 'Lead',
        eventId: 'e1',
        madid: 'idfa-123',
        anonId: 'anon-1',
        pageId: 'page-1',
        pageScopedUserId: 'psid-1',
        ctwaClid: 'ctwa-1',
        igAccountId: 'ig-1',
        igSid: 'igsid-1',
      },
      { clientIpAddress: undefined, clientUserAgent: undefined, fbp: undefined, fbc: undefined, referrerUrl: undefined },
    )
    expect(event.userData?.madid).toBe('idfa-123')
    expect(event.userData?.anonId).toBe('anon-1')
    expect(event.userData?.pageId).toBe('page-1')
    expect(event.userData?.pageScopedUserId).toBe('psid-1')
    expect(event.userData?.ctwaClid).toBe('ctwa-1')
    expect(event.userData?.igAccountId).toBe('ig-1')
    expect(event.userData?.igSid).toBe('igsid-1')
  })

  it('passes through appData and top-level custom_data fields', () => {
    const event = buildServerEvent(
      {
        eventName: 'Purchase',
        eventId: 'e1',
        status: 'completed',
        delivery_category: 'home_delivery',
        appData: { advertiserTrackingEnabled: 1, extinfo: ['i2', 'com.example'] },
      },
      { clientIpAddress: undefined, clientUserAgent: undefined, fbp: undefined, fbc: undefined, referrerUrl: undefined },
    )
    expect(event.customData?.status).toBe('completed')
    expect(event.customData?.delivery_category).toBe('home_delivery')
    expect(event.appData?.advertiserTrackingEnabled).toBe(1)
  })

  it('omits customData entirely when nothing is set', () => {
    const event = buildServerEvent(
      { eventName: 'PageView', eventId: 'e1' },
      { clientIpAddress: undefined, clientUserAgent: undefined, fbp: undefined, fbc: undefined, referrerUrl: undefined },
    )
    expect(event.customData).toBeUndefined()
  })

  it('merges caller-supplied customData onto known custom fields', () => {
    const event = buildServerEvent(
      {
        eventName: 'Lead',
        eventId: 'e1',
        value: 10,
        customData: { lead_score: 'high' },
      },
      { clientIpAddress: undefined, clientUserAgent: undefined, fbp: undefined, fbc: undefined, referrerUrl: undefined },
    )
    expect(event.customData).toEqual({ value: 10, lead_score: 'high' })
  })

  it('respects an explicit actionSource override', () => {
    const event = buildServerEvent(
      { eventName: 'Contact', eventId: 'e1' },
      { clientIpAddress: undefined, clientUserAgent: undefined, fbp: undefined, fbc: undefined, referrerUrl: undefined },
      'app',
    )
    expect(event.actionSource).toBe('app')
  })
})
