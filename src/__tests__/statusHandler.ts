import statusHandler from '../statusHandler'
import { Client, Context } from '../types'

const mockList = jest.fn()
const merge = jest.fn()
const get = jest.fn()

const client = {
    pulls: {
        list: mockList,
        merge,
        get,
    },
}

describe('status handler', () => {
    it('should merge prs for which current commit is HEAD', async () => {
        const owner = 'john doe'
        const repo = 'repo'
        const context = {
            repo: { repo, owner },
            eventName: 'status',
            payload: {
                sha: 'abcdef',
                state: 'success',
                branches: [
                    {
                        name: 'first',
                    },
                    {
                        name: 'second',
                    },
                    {
                        name: 'third',
                    },
                ],
            },
        }
        mockList.mockReturnValueOnce({ data: [] })
        mockList.mockReturnValueOnce({ data: [{ number: 2 }] })
        mockList.mockReturnValueOnce({ data: [{ number: 3 }] })
        get.mockReturnValueOnce({ data: { number: 2, mergeable: false } })
        get.mockReturnValueOnce({ data: { number: 3, mergeable: true } })
        await statusHandler(
            (client as unknown) as Client,
            (context as unknown) as Context,
        )
        expect(client.pulls.list).toHaveBeenCalledTimes(3)
        expect(client.pulls.list).toHaveBeenNthCalledWith(1, {
            owner,
            repo,
            state: 'open',
            head: 'first',
        })
        expect(client.pulls.list).toHaveBeenNthCalledWith(2, {
            owner,
            repo,
            state: 'open',
            head: 'second',
        })
        expect(client.pulls.list).toHaveBeenNthCalledWith(3, {
            owner,
            repo,
            state: 'open',
            head: 'third',
        })
        expect(get).toBeCalledTimes(2)
        expect(get).toHaveBeenNthCalledWith(1, {
            repo,
            owner,
            pull_number: 2,
        })
        expect(get).toHaveBeenNthCalledWith(2, {
            repo,
            owner,
            pull_number: 3,
        })
        expect(merge).toHaveBeenCalledWith({
            repo,
            owner,
            pull_number: 3,
            sha: 'abcdef',
        })
    })
})