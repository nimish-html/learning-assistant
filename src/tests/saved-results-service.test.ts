/**
 * Unit tests for SavedResultsService
 * 
 * These tests verify the CRUD operations, error handling, and data validation
 * for the saved results service using mocked Supabase client.
 */

import { SavedResultsService } from '../lib/saved-results-service'
import { supabase } from '../lib/supabase'
import type { SaveResultsPayload, SavedResult } from '../lib/schema'

// Mock Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('SavedResultsService', () => {
  // Mock data
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
  const mockResultId = '987fcdeb-51a2-43d1-b789-123456789abc'
  
  const mockSavePayload: SaveResultsPayload = {
    title: 'Test Questions',
    questions: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        stem: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        answer: '4',
        explanation: 'Basic addition',
        difficulty: 'Beginner',
        subject: 'Mathematics'
      }
    ],
    metadata: {
      exam: 'JEE Main',
      classStandard: '12th',
      difficulty: 'Beginner',
      type: 'MCQ',
      outputFormat: 'solved-examples',
      questionCount: 1
    }
  }

  const mockSavedResult: SavedResult = {
    id: mockResultId,
    user_id: mockUserId,
    title: 'Test Questions',
    questions: mockSavePayload.questions,
    metadata: mockSavePayload.metadata,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('saveResults', () => {
    it('should save results successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockSavedResult,
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      } as any)

      const result = await SavedResultsService.saveResults(mockSavePayload, mockUserId)

      expect(mockSupabase.from).toHaveBeenCalledWith('saved_results')
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        title: 'Test Questions',
        questions: mockSavePayload.questions,
        metadata: mockSavePayload.metadata
      })
      expect(result).toEqual(mockSavedResult)
    })

    it('should throw error for invalid payload', async () => {
      const invalidPayload = {
        title: '', // Invalid: empty title
        questions: [],
        metadata: mockSavePayload.metadata
      }

      await expect(
        SavedResultsService.saveResults(invalidPayload as any, mockUserId)
      ).rejects.toThrow('Invalid payload')
    })

    it('should throw error for invalid user ID', async () => {
      await expect(
        SavedResultsService.saveResults(mockSavePayload, '')
      ).rejects.toThrow('Valid user ID is required')
    })

    it('should handle database errors', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error', code: '23505' }
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      } as any)

      await expect(
        SavedResultsService.saveResults(mockSavePayload, mockUserId)
      ).rejects.toThrow('A result with this title already exists')
    })

    it('should throw error when no data is returned', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      } as any)

      await expect(
        SavedResultsService.saveResults(mockSavePayload, mockUserId)
      ).rejects.toThrow('Failed to save results - no data returned')
    })
  })

  describe('getUserResults', () => {
    it('should retrieve user results successfully', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [mockSavedResult],
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any)

      const results = await SavedResultsService.getUserResults(mockUserId)

      expect(mockSupabase.from).toHaveBeenCalledWith('saved_results')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(results).toEqual([mockSavedResult])
    })

    it('should return empty array when no results found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any)

      const results = await SavedResultsService.getUserResults(mockUserId)

      expect(results).toEqual([])
    })

    it('should throw error for invalid user ID', async () => {
      await expect(
        SavedResultsService.getUserResults('')
      ).rejects.toThrow('Valid user ID is required')
    })

    it('should handle database errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error', code: 'CONNECTION_ERROR' }
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any)

      await expect(
        SavedResultsService.getUserResults(mockUserId)
      ).rejects.toThrow('Database error')
    })

    it('should filter out invalid data and log warnings', async () => {
      const invalidResult = { ...mockSavedResult, id: 'invalid-uuid' }
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [mockSavedResult, invalidResult],
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any)

      const results = await SavedResultsService.getUserResults(mockUserId)

      expect(results).toEqual([mockSavedResult])
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid saved result data found:',
        'invalid-uuid',
        expect.any(Object)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getResultById', () => {
    it('should retrieve result by ID successfully', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSavedResult,
              error: null
            })
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any)

      const result = await SavedResultsService.getResultById(mockResultId, mockUserId)

      expect(mockSupabase.from).toHaveBeenCalledWith('saved_results')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(result).toEqual(mockSavedResult)
    })

    it('should throw error for invalid result ID', async () => {
      await expect(
        SavedResultsService.getResultById('', mockUserId)
      ).rejects.toThrow('Valid result ID is required')
    })

    it('should throw error for invalid user ID', async () => {
      await expect(
        SavedResultsService.getResultById(mockResultId, '')
      ).rejects.toThrow('Valid user ID is required')
    })

    it('should throw error when result not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' }
            })
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any)

      await expect(
        SavedResultsService.getResultById(mockResultId, mockUserId)
      ).rejects.toThrow('Saved result not found')
    })
  })

  describe('updateResultTitle', () => {
    it('should update result title successfully', async () => {
      const updatedResult = { ...mockSavedResult, title: 'Updated Title' }
      
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedResult,
                error: null
              })
            })
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate
      } as any)

      const result = await SavedResultsService.updateResultTitle(
        mockResultId, 
        mockUserId, 
        'Updated Title'
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('saved_results')
      expect(mockUpdate).toHaveBeenCalledWith({
        title: 'Updated Title',
        updated_at: expect.any(String)
      })
      expect(result).toEqual(updatedResult)
    })

    it('should throw error for invalid inputs', async () => {
      await expect(
        SavedResultsService.updateResultTitle('', mockUserId, 'New Title')
      ).rejects.toThrow('Valid result ID is required')

      await expect(
        SavedResultsService.updateResultTitle(mockResultId, '', 'New Title')
      ).rejects.toThrow('Valid user ID is required')

      await expect(
        SavedResultsService.updateResultTitle(mockResultId, mockUserId, '')
      ).rejects.toThrow('Valid title is required')
    })

    it('should throw error when result not found', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' }
              })
            })
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate
      } as any)

      await expect(
        SavedResultsService.updateResultTitle(mockResultId, mockUserId, 'New Title')
      ).rejects.toThrow('Saved result not found')
    })
  })

  describe('deleteResult', () => {
    it('should delete result successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        delete: mockDelete
      } as any)

      await SavedResultsService.deleteResult(mockResultId, mockUserId)

      expect(mockSupabase.from).toHaveBeenCalledWith('saved_results')
      expect(mockDelete).toHaveBeenCalled()
    })

    it('should throw error for invalid inputs', async () => {
      await expect(
        SavedResultsService.deleteResult('', mockUserId)
      ).rejects.toThrow('Valid result ID is required')

      await expect(
        SavedResultsService.deleteResult(mockResultId, '')
      ).rejects.toThrow('Valid user ID is required')
    })

    it('should handle database errors', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Database error', code: 'CONNECTION_ERROR' }
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        delete: mockDelete
      } as any)

      await expect(
        SavedResultsService.deleteResult(mockResultId, mockUserId)
      ).rejects.toThrow('Database error')
    })
  })

  describe('getUserResultsCount', () => {
    it('should return count successfully', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          count: 5,
          error: null
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any)

      const count = await SavedResultsService.getUserResultsCount(mockUserId)

      expect(mockSupabase.from).toHaveBeenCalledWith('saved_results')
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(count).toBe(5)
    })

    it('should return 0 when count is null', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          count: null,
          error: null
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any)

      const count = await SavedResultsService.getUserResultsCount(mockUserId)

      expect(count).toBe(0)
    })

    it('should throw error for invalid user ID', async () => {
      await expect(
        SavedResultsService.getUserResultsCount('')
      ).rejects.toThrow('Valid user ID is required')
    })

    it('should handle database errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          count: null,
          error: { message: 'Database error', code: 'CONNECTION_ERROR' }
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      } as any)

      await expect(
        SavedResultsService.getUserResultsCount(mockUserId)
      ).rejects.toThrow('Database error')
    })
  })

  describe('error message handling', () => {
    it('should return user-friendly error messages for common database errors', async () => {
      const testCases = [
        { code: '23505', expected: 'A result with this title already exists' },
        { code: '23503', expected: 'Invalid user reference' },
        { code: 'PGRST116', expected: 'The requested result was not found' }
      ]

      for (const testCase of testCases) {
        const mockInsert = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: testCase.code }
            })
          })
        })

        mockSupabase.from.mockReturnValue({
          insert: mockInsert
        } as any)

        await expect(
          SavedResultsService.saveResults(mockSavePayload, mockUserId)
        ).rejects.toThrow(testCase.expected)
      }
    })

    it('should handle network and connection errors', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'network error occurred', code: 'NETWORK_ERROR' }
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      } as any)

      await expect(
        SavedResultsService.saveResults(mockSavePayload, mockUserId)
      ).rejects.toThrow('Network error. Please check your connection and try again.')
    })
  })
})