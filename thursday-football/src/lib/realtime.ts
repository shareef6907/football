// Real-time event system for Thursday Football
// Handles cross-component data synchronization

export type EventType = 
  | 'ratingsUpdated'
  | 'playerStatsUpdated' 
  | 'adminAction'
  | 'dataUpdated'
  | 'teamGenerated'
  | 'monthlyReset'

export interface UpdateEvent {
  type: EventType
  source: string
  timestamp: string
  data?: any
}

export class RealTimeEvents {
  private static instance: RealTimeEvents
  private listeners: Map<EventType, Set<(event: UpdateEvent) => void>> = new Map()
  
  static getInstance(): RealTimeEvents {
    if (!RealTimeEvents.instance) {
      RealTimeEvents.instance = new RealTimeEvents()
    }
    return RealTimeEvents.instance
  }
  
  // Dispatch an update event to all listening components
  dispatch(type: EventType, source: string, data?: any) {
    const event: UpdateEvent = {
      type,
      source,
      timestamp: new Date().toISOString(),
      data
    }
    
    // Console log for debugging
    console.log(`🔄 Real-time event dispatched:`, event)
    
    // Dispatch to custom event listeners
    window.dispatchEvent(new CustomEvent(type, { detail: event }))
    
    // Dispatch to programmatic listeners
    const typeListeners = this.listeners.get(type)
    if (typeListeners) {
      typeListeners.forEach(callback => callback(event))
    }
    
    // Always dispatch general 'dataUpdated' event
    if (type !== 'dataUpdated') {
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: event }))
    }
  }
  
  // Subscribe to specific event types
  subscribe(type: EventType, callback: (event: UpdateEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)
    
    return () => {
      this.listeners.get(type)?.delete(callback)
    }
  }
  
  // Helper methods for common events
  static dispatchRatingUpdate(source: string, ratingsCount?: number) {
    RealTimeEvents.getInstance().dispatch('ratingsUpdated', source, { ratingsCount })
  }
  
  static dispatchPlayerStatsUpdate(source: string, player: string, stats: any) {
    RealTimeEvents.getInstance().dispatch('playerStatsUpdated', source, { player, stats })
  }
  
  static dispatchAdminAction(action: string, details?: any) {
    RealTimeEvents.getInstance().dispatch('adminAction', 'admin', { action, ...details })
  }
  
  static dispatchTeamGeneration(source: string, teams: any) {
    RealTimeEvents.getInstance().dispatch('teamGenerated', source, { teams })
  }
}

// Export singleton instance
export const realTimeEvents = RealTimeEvents.getInstance()

// Utility function to add DOM event listeners with cleanup
export function useRealTimeListener(
  eventType: EventType,
  callback: (event: CustomEvent) => void,
  deps: any[] = []
) {
  // This would be used in useEffect in components
  // Returns cleanup function
  return () => {
    window.addEventListener(eventType, callback as EventListener)
    return () => window.removeEventListener(eventType, callback as EventListener)
  }
}

// Event validation and debugging utilities
export function validateRealTimeSystem() {
  const testEvent: UpdateEvent = {
    type: 'ratingsUpdated',
    source: 'test',
    timestamp: new Date().toISOString(),
    data: { test: true }
  }
  
  console.log('🧪 Testing real-time system...')
  realTimeEvents.dispatch('ratingsUpdated', 'validation-test', { test: true })
  
  return {
    eventDispatched: true,
    timestamp: testEvent.timestamp
  }
}