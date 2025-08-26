import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["messagesContainer", "messageInput", "messageInputContainer", "chatTitle", "chatSubtitle", "sendBtn", "settingsModal"]
  
  connect() {
    console.log("Dashboard controller connected!")
    this.currentChatId = null
    this.currentChatTitle = null
    this.chatToDelete = null
    this.setupEventListeners()
    this.setupAutoResize()
    this.startProviderMonitoring()
    this.setupInfiniteScroll()
    
    // Debug: Check if modal elements exist
    console.log("Modal elements check:")
    console.log("chat-action-modal:", document.getElementById('chat-action-modal'))
    console.log("modal-icon:", document.getElementById('modal-icon'))
    console.log("modal-title:", document.getElementById('modal-title'))
    console.log("modal-subtitle:", document.getElementById('modal-subtitle'))
    console.log("modal-description:", document.getElementById('modal-description'))
    console.log("confirm-action:", document.getElementById('confirm-action'))
    console.log("cancel-action:", document.getElementById('cancel-action'))
  }
  
  setupEventListeners() {
    // Use event delegation for dynamically generated elements
    this.element.addEventListener('click', (e) => {
      // New chat button
      if (e.target.closest('#new-chat-btn')) {
        e.preventDefault()
        console.log("New chat button clicked")
        this.createNewChat()
      }
      
      // Start chat button
      if (e.target.closest('#start-chat-btn')) {
        e.preventDefault()
        console.log("Start chat button clicked")
        this.createNewChat()
      }
      
      // Chat item clicks
      if (e.target.closest('.chat-item')) {
        e.preventDefault()
        const chatItem = e.target.closest('.chat-item')
        const chatId = chatItem.dataset.chatId
        console.log("Chat item clicked:", chatId)
        this.loadChat(chatId)
      }
      
      // Settings button
      if (e.target.closest('#settings-btn')) {
        e.preventDefault()
        console.log("Settings button clicked")
        this.openSettings()
      }
      
      // Close settings
      if (e.target.closest('#close-settings')) {
        e.preventDefault()
        console.log("Close settings clicked")
        this.closeSettings()
      }
      
      // Delete chat toolbar button clicks
      if (e.target.closest('#delete-chat-toolbar-btn')) {
        e.preventDefault()
        console.log("Delete chat toolbar button clicked")
        console.log("Current chat ID:", this.currentChatId)
        console.log("Current chat title:", this.currentChatTitle)
        this.showDeleteConfirmation(this.currentChatId, this.currentChatTitle)
      }

      // Cancel delete button clicks
      if (e.target.closest('#cancel-delete')) {
        e.preventDefault()
        console.log("Cancel delete clicked")
        this.hideDeleteConfirmation()
      }

      // Confirm delete button clicks
      if (e.target.closest('#confirm-delete')) {
        e.preventDefault()
        console.log("Confirm delete clicked")
        this.deleteChat()
      }

      // Close delete modal on backdrop click
      const deleteModal = document.getElementById('delete-chat-modal')
      if (deleteModal && e.target === deleteModal) {
        this.hideDeleteConfirmation()
      }

      // User profile button clicks
      if (e.target.closest('#user-profile-btn')) {
        e.preventDefault()
        this.toggleUserProfileMenu()
      }

      // Close user profile menu when clicking outside
      const userProfileMenu = document.getElementById('user-profile-menu')
      if (userProfileMenu && !e.target.closest('#user-profile-btn') && !e.target.closest('#user-profile-menu')) {
        this.hideUserProfileMenu()
      }

      // Chat actions button clicks
      if (e.target.closest('#chat-actions-btn')) {
        e.preventDefault()
        this.toggleChatActionsMenu()
      }

      // Close chat actions menu when clicking outside
      const chatActionsMenu = document.getElementById('chat-actions-menu')
      if (chatActionsMenu && !e.target.closest('#chat-actions-btn') && !e.target.closest('#chat-actions-menu')) {
        this.hideChatActionsMenu()
      }

      // Chat action buttons
      if (e.target.closest('#archive-chat-btn')) {
        e.preventDefault()
        console.log("Archive button clicked")
        this.showChatActionModal('archive', 'Archive Chat?', 'This will move the chat to your archived chats.', 'bg-blue-100', 'text-blue-600', 'Archive')
      }

      if (e.target.closest('#report-chat-btn')) {
        e.preventDefault()
        console.log("Report button clicked")
        this.showChatActionModal('report', 'Report Chat?', 'This will flag the chat for review by our team.', 'bg-yellow-100', 'text-yellow-600', 'Report')
      }

      if (e.target.closest('#delete-chat-btn')) {
        e.preventDefault()
        console.log("Delete button clicked")
        this.showChatActionModal('delete', 'Delete Chat?', 'This will permanently delete the chat and all its messages.', 'bg-red-100', 'text-red-600', 'Delete')
      }

      // Cancel action button
      if (e.target.closest('#cancel-action')) {
        e.preventDefault()
        console.log("Cancel button clicked")
        this.hideChatActionModal()
      }

      // Confirm action button
      if (e.target.closest('#confirm-action')) {
        e.preventDefault()
        console.log("Confirm button clicked")
        this.confirmChatAction()
      }

      // Close chat action modal on backdrop click
      const chatActionModal = document.getElementById('chat-action-modal')
      if (chatActionModal && e.target === chatActionModal) {
        console.log("Backdrop clicked, hiding modal")
        this.hideChatActionModal()
      }
    })
    
    // Send button
    if (this.hasSendBtnTarget) {
      this.sendBtnTarget.addEventListener('click', () => {
        console.log("Send button clicked")
        this.sendMessage()
      })
    }
    
    // Enter key in message input
    if (this.hasMessageInputTarget) {
      this.messageInputTarget.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          console.log("Enter key pressed in message input")
          this.sendMessage()
        }
      })
    }

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideChatActionModal()
        this.hideUserProfileMenu()
        this.hideChatActionsMenu()
      }
    })

    // Direct event listeners for modal buttons (since modal is outside main element)
    document.addEventListener('click', (e) => {
      // Cancel action button
      if (e.target.closest('#cancel-action')) {
        e.preventDefault()
        console.log("Cancel button clicked (direct)")
        this.hideChatActionModal()
      }

      // Confirm action button
      if (e.target.closest('#confirm-action')) {
        e.preventDefault()
        console.log("Confirm button clicked (direct)")
        this.confirmChatAction()
      }

      // Close chat action modal on backdrop click
      const chatActionModal = document.getElementById('chat-action-modal')
      if (chatActionModal && e.target === chatActionModal) {
        console.log("Backdrop clicked (direct), hiding modal")
        this.hideChatActionModal()
      }
    })
    
    // Close modal on backdrop click
    if (this.hasSettingsModalTarget) {
      this.settingsModalTarget.addEventListener('click', (e) => {
        if (e.target === this.settingsModalTarget) {
          this.closeSettings()
        }
      })
    }
  }
  
  setupAutoResize() {
    if (this.hasMessageInputTarget) {
      const textarea = this.messageInputTarget
      const minHeight = 44 // Minimum height in pixels
      const maxHeight = 300 // Maximum height in pixels
      
      // Add custom scrollbar styles
      textarea.style.resize = 'none'
      textarea.style.overflowY = 'hidden' // Start with hidden scrollbar
      textarea.style.scrollbarWidth = 'thin'
      textarea.style.scrollbarColor = '#cbd5e1 #f1f5f9'
      
      // Add CSS for webkit scrollbar styling
      const style = document.createElement('style')
      style.textContent = `
        textarea::-webkit-scrollbar {
          width: 6px;
        }
        textarea::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        textarea::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        textarea::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `
      document.head.appendChild(style)
      
      textarea.addEventListener('input', () => {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto'
        
        // Calculate new height - allow it to grow up to maxHeight
        const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight))
        
        // Only update if the height actually changed
        if (parseInt(textarea.style.height) !== newHeight) {
          textarea.style.height = newHeight + 'px'
        }
        
        // Show scrollbar only when at maximum height
        if (newHeight >= maxHeight) {
          textarea.style.overflowY = 'auto'
          // Scroll to bottom to show the latest content
          textarea.scrollTop = textarea.scrollHeight
        } else {
          textarea.style.overflowY = 'hidden'
        }
      })
      
      // Set initial height
      textarea.style.height = minHeight + 'px'
    }
  }
  
  async createNewChat() {
    console.log("Creating new chat...")
    try {
                const response = await fetch('/chats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
            },
            body: JSON.stringify({
              chat: {
                title: 'New Chat'
              }
            })
          })
      
      if (response.ok) {
        const chat = await response.json()
        console.log("New chat created:", chat)
        await this.loadChat(chat.id)
        await this.updateChatList()
        // Reset infinite scroll since we have a new chat at the top
        this.resetInfiniteScroll()
      }
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }
  
  async loadChat(chatId) {
    console.log("Loading chat:", chatId)
    try {
      const response = await fetch(`/chats/${chatId}`, {
        headers: {
          'Accept': 'application/json'
        }
      })
      if (response.ok) {
        const chat = await response.json()
        this.currentChatId = chatId
        this.currentChatTitle = chat.title
        this.displayChat(chat)
        this.showMessageInput()
        this.showChatActionsContainer()
        
        // Highlight selected chat in sidebar
        document.querySelectorAll('.chat-item').forEach(item => {
          item.classList.remove('active')
        })
        const selectedItem = document.querySelector(`[data-chat-id="${chatId}"]`)
        if (selectedItem) {
          selectedItem.classList.add('active')
        }
        
        // Close mobile sidebar when chat is selected
        this.closeMobileSidebar()
        

      }
    } catch (error) {
      console.error('Error loading chat:', error)
    }
  }
  
  displayChat(chat) {
    console.log("Displaying chat:", chat)
    this.chatTitleTarget.textContent = chat.title
    this.chatSubtitleTarget.textContent = `${chat.messages.length} messages`
    
    // Clear and populate messages
    this.messagesContainerTarget.innerHTML = ''
    
    if (chat.messages.length === 0) {
      this.showWelcomeMessage()
    } else {
      chat.messages.forEach(message => {
        this.addMessage(message)
      })
    }
    
    this.scrollToBottom()
  }
  
  showWelcomeMessage() {
    this.messagesContainerTarget.innerHTML = `
      <div class="text-center py-12">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-white rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">🚀</span>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">New Chat Started</h3>
        <p class="text-gray-500">Start typing to begin your conversation with AI</p>
      </div>
    `
  }
  
  addMessage(message) {
    const messageElement = document.createElement('div')
    messageElement.className = 'flex space-x-4 mb-4'
    
    const isUser = message.role === 'user'
    const alignment = isUser ? 'justify-end' : 'justify-start'
    const bgColor = isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
    
    messageElement.innerHTML = `
      <div class="flex ${alignment} w-full">
        <div class="max-w-3xl ${bgColor} rounded-lg px-4 py-3">
          <div class="whitespace-pre-wrap">${message.content}</div>
        </div>
      </div>
    `
    
    this.messagesContainerTarget.appendChild(messageElement)
  }
  
  async sendMessage() {
    console.log("=== NEW sendMessage method called ===")
    const content = this.messageInputTarget.value.trim()
    console.log("Content:", content)
    console.log("Current chat ID:", this.currentChatId)
    console.log("Content is empty:", !content)
    console.log("Current chat ID is null:", !this.currentChatId)
    if (!content || !this.currentChatId) {
      console.log("Returning early from sendMessage")
      return
    }
    
    console.log("Continuing with sendMessage...")
    
    console.log("Sending message:", content)
    
    // Update title on first message
    const messageElements = this.messagesContainerTarget.querySelectorAll('.flex.space-x-4.mb-4')
    if (messageElements.length === 0) {
      console.log("First message detected, updating title")
      const title = content.length > 100 ? content.substring(0, 100) + '...' : content
      await this.updateChatTitle(title)
    }
    
    // Add user message immediately
    const userMessage = {
      role: 'user',
      content: content
    }
    this.addMessage(userMessage)
    
    // Check if this is the first message and update title
    const messageElementsAfterAdd = this.messagesContainerTarget.querySelectorAll('.flex.space-x-4.mb-4')
    const isFirstMessage = messageElementsAfterAdd.length === 1 // Just the user message we just added
    console.log("Is first message:", isFirstMessage)
    
    if (isFirstMessage) {
      const title = content.length > 100 ? content.substring(0, 100) + '...' : content
      console.log("Updating title to:", title)
      await this.updateChatTitle(title)
    }
    
    // Clear input and reset height
    this.messageInputTarget.value = ''
    this.messageInputTarget.style.height = '44px' // Reset to minimum height
    this.messageInputTarget.scrollTop = 0 // Reset scroll position
    this.scrollToBottom()
    
    // Show thinking indicator
    this.showThinkingIndicator()
    
    try {
      const response = await fetch(`/chats/${this.currentChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({
          message: { content: content }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.assistant_message) {
          // Hide thinking indicator
          this.hideThinkingIndicator()
          
          this.addMessage(result.assistant_message)
          this.scrollToBottom()
          
          // If this was the first AI response, generate a better title
          if (isFirstMessage) {
            await this.generateAITitle(content, result.assistant_message.content)
          }
          
          // Update the chat list to reflect the new message count
          await this.updateChatList()
          
          // Update provider usage from the response data
          console.log('Updating usage from message response...')
          this.updateUsageFromResult(result)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Hide thinking indicator on error
      this.hideThinkingIndicator()
    }
  }
  
  showMessageInput() {
    this.messageInputContainerTarget.style.display = 'block'
    this.messageInputTarget.focus()
  }

  hideMessageInput() {
    this.messageInputContainerTarget.style.display = 'none'
  }
  
  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainerTarget.scrollTop = this.messagesContainerTarget.scrollHeight
    }, 100)
  }
  
  openSettings() {
    this.settingsModalTarget.classList.remove('hidden')
  }
  
  closeSettings() {
    this.settingsModalTarget.classList.add('hidden')
  }

  toggleUserProfileMenu() {
    const menu = document.getElementById('user-profile-menu')
    if (menu) {
      if (menu.classList.contains('hidden')) {
        this.showUserProfileMenu()
      } else {
        this.hideUserProfileMenu()
      }
    }
  }

  showUserProfileMenu() {
    const menu = document.getElementById('user-profile-menu')
    if (menu) {
      menu.classList.remove('hidden')
    }
  }

  hideUserProfileMenu() {
    const menu = document.getElementById('user-profile-menu')
    if (menu) {
      menu.classList.add('hidden')
    }
  }

  toggleChatActionsMenu() {
    const menu = document.getElementById('chat-actions-menu')
    if (menu) {
      if (menu.classList.contains('hidden')) {
        this.showChatActionsMenu()
      } else {
        this.hideChatActionsMenu()
      }
    }
  }

  showChatActionsMenu() {
    const menu = document.getElementById('chat-actions-menu')
    if (menu) {
      menu.classList.remove('hidden')
    }
  }

  hideChatActionsMenu() {
    const menu = document.getElementById('chat-actions-menu')
    if (menu) {
      menu.classList.add('hidden')
    }
  }

  showChatActionModal(action, title, description, iconBgClass, iconTextClass, buttonText) {
    console.log("Showing chat action modal:", action)
    this.currentChatAction = action
    
    const modal = document.getElementById('chat-action-modal')
    const modalIcon = document.getElementById('modal-icon')
    const modalTitle = document.getElementById('modal-title')
    const modalSubtitle = document.getElementById('modal-subtitle')
    const modalDescription = document.getElementById('modal-description')
    const confirmButton = document.getElementById('confirm-action')
    
    console.log("Modal elements found:", { modal, modalIcon, modalTitle, modalSubtitle, modalDescription, confirmButton })
    
    if (modal && modalIcon && modalTitle && modalSubtitle && modalDescription && confirmButton) {
      // Set icon
      modalIcon.className = `w-10 h-10 ${iconBgClass} rounded-full flex items-center justify-center`
      modalIcon.innerHTML = this.getActionIcon(action, iconTextClass)
      
      // Set text
      modalTitle.textContent = title
      modalSubtitle.textContent = 'This action cannot be undone.'
      modalDescription.innerHTML = description.replace('the chat', `<span class="font-medium">${this.currentChatTitle}</span>`)
      
      // Set button
      confirmButton.textContent = buttonText
      confirmButton.className = `px-4 py-2 ${action === 'delete' ? 'bg-red-600 hover:bg-red-700' : action === 'archive' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded-lg font-medium transition-colors`
      
      // Show modal
      modal.classList.remove('hidden')
      this.hideChatActionsMenu()
    }
  }

  hideChatActionModal() {
    console.log("Hiding chat action modal")
    const modal = document.getElementById('chat-action-modal')
    if (modal) {
      modal.classList.add('hidden')
      console.log("Modal hidden")
    } else {
      console.log("Modal not found")
    }
    this.currentChatAction = null
  }

  getActionIcon(action, textClass) {
    switch (action) {
      case 'archive':
        return `<svg class="w-6 h-6 ${textClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
        </svg>`
      case 'report':
        return `<svg class="w-6 h-6 ${textClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>`
      case 'delete':
        return `<svg class="w-6 h-6 ${textClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>`
      default:
        return ''
    }
  }

  async confirmChatAction() {
    if (!this.currentChatAction || !this.currentChatId) return
    
    console.log("Confirming action:", this.currentChatAction, "for chat:", this.currentChatId)
    
    try {
      const response = await fetch(`/dashboard/update_chat_status/${this.currentChatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({
          status: this.currentChatAction
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log("Action result:", result)
        
        // Hide modal
        this.hideChatActionModal()
        
        // Return to dashboard
        this.returnToDashboard()
      } else {
        const errorText = await response.text()
        console.error('Failed to update chat status:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error updating chat status:', error)
    }
  }

  returnToDashboard() {
    console.log("Returning to dashboard...")
    
    // Clear current chat
    this.currentChatId = null
    this.currentChatTitle = null
    
    // Update UI
    this.chatTitleTarget.textContent = 'Welcome to SkyTorch'
    this.chatSubtitleTarget.textContent = 'Start a new conversation or select an existing chat'
    this.messagesContainerTarget.innerHTML = this.getWelcomeMessage()
    this.hideMessageInput()
    this.hideChatActionsContainer()
    
    // Update chat list
    console.log("Calling updateChatList...")
    this.updateChatList()
  }

  showChatActionsContainer() {
    const container = document.getElementById('chat-actions-container')
    if (container) {
      container.classList.remove('hidden')
    }
  }

  hideChatActionsContainer() {
    const container = document.getElementById('chat-actions-container')
    if (container) {
      container.classList.add('hidden')
    }
  }
  
    showThinkingIndicator() {
    const thinkingElement = document.createElement('div')
    thinkingElement.className = 'flex space-x-4 mb-4'
    thinkingElement.id = 'thinking-indicator'
    
    thinkingElement.innerHTML = `
      <div class="flex justify-start w-full">
        <div class="max-w-3xl bg-gray-100 text-gray-900 rounded-lg px-4 py-3">
          <div class="flex items-center space-x-2">
            <span class="text-gray-600 italic">Thinking</span>
            <div class="thinking-dots">
              <span class="dot">.</span>
              <span class="dot">.</span>
              <span class="dot">.</span>
            </div>
          </div>
        </div>
      </div>
    `
    
    this.messagesContainerTarget.appendChild(thinkingElement)
    this.scrollToBottom()
  }
  
  hideThinkingIndicator() {
    const thinkingElement = document.getElementById('thinking-indicator')
    if (thinkingElement) {
      thinkingElement.remove()
    }
  }
  
  async updateChatList() {
    console.log("Updating chat list...")
    try {
      const response = await fetch('/chats', {
        headers: {
          'Accept': 'application/json'
        }
      })
      if (response.ok) {
        const chats = await response.json()
        console.log("Received chats:", chats)
        
        const chatList = document.getElementById('chat-list')
        console.log("Chat list element:", chatList)
        
        if (chatList) {
          // Only update the first 8 chats (initial load)
          const initialChats = chats.slice(0, 8)
          console.log("Initial chats to display:", initialChats)
          
          chatList.innerHTML = initialChats.map(chat => `
            <div class="chat-item-container group relative" data-chat-id="${chat.id}">
              <button class="chat-item w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors" data-chat-id="${chat.id}">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">${chat.title}</p>
                    <p class="text-xs text-gray-500">${chat.message_count} message${chat.message_count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </button>
            </div>
          `).join('')
          
          console.log("Chat list updated with", initialChats.length, "chats")
          
          // Reset infinite scroll state
          this.resetInfiniteScroll()
        } else {
          console.log("Chat list element not found!")
        }
      } else {
        console.error('Failed to fetch chats:', response.status)
      }
    } catch (error) {
      console.error('Error updating chat list:', error)
    }
  }

  startProviderMonitoring() {
    // Check provider status every 30 seconds
    this.checkProviderStatus()
    setInterval(() => {
      this.checkProviderStatus()
    }, 30000) // 30 seconds
  }

  async checkProviderStatus() {
    try {
      const response = await fetch('/dashboard/connection_status', {
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const status = await response.json()
        this.updateProviderIndicator(status)
      }
    } catch (error) {
      console.error('Error checking provider status:', error)
      this.updateProviderIndicator({
        status: 'disconnected',
        message: 'Connection check failed'
      })
    }
  }

  updateProviderIndicator(status) {
    const indicator = document.getElementById('provider-status-indicator')
    const requestsUsage = document.getElementById('requests-usage')
    const tokensUsage = document.getElementById('tokens-usage')
    
    if (!indicator) return

    // Update status indicator
    if (status.status === 'connected') {
      indicator.innerHTML = '<div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>'
    } else if (status.status === 'warning') {
      indicator.innerHTML = '<div class="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>'
    } else {
      indicator.innerHTML = '<div class="w-3 h-3 bg-red-400 rounded-full"></div>'
    }

    // Update usage information
    if (status.usage && requestsUsage && tokensUsage) {
      const requests = status.usage.requests
      const tokens = status.usage.tokens
      
      requestsUsage.textContent = `${requests.used}/${requests.limit}`
      tokensUsage.textContent = `${tokens.used}/${tokens.limit}`
    }
  }

  updateUsageFromResult(result) {
    console.log('Extracting usage from response data...')
    
    if (result.rate_limits) {
      const { remaining_requests, limit_requests, remaining_tokens, limit_tokens } = result.rate_limits
      
      console.log('Rate limit data:', {
        remaining_requests,
        limit_requests,
        remaining_tokens,
        limit_tokens
      })
      
      if (remaining_requests && limit_requests && remaining_tokens && limit_tokens) {
        const usedRequests = parseInt(limit_requests) - parseInt(remaining_requests)
        const usedTokens = parseInt(limit_tokens) - parseInt(remaining_tokens)
        
        const requestsUsage = document.getElementById('requests-usage')
        const tokensUsage = document.getElementById('tokens-usage')
        
        if (requestsUsage && tokensUsage) {
          requestsUsage.textContent = `${usedRequests}/${limit_requests}`
          tokensUsage.textContent = `${usedTokens}/${limit_tokens}`
          
          // Add visual feedback
          requestsUsage.style.backgroundColor = '#fef3c7'
          tokensUsage.style.backgroundColor = '#fef3c7'
          
          setTimeout(() => {
            requestsUsage.style.backgroundColor = ''
            tokensUsage.style.backgroundColor = ''
          }, 1000)
          
          console.log('Usage updated from response data:', { usedRequests, usedTokens })
        }
      }
    } else {
      console.log('Rate limit data not found in response')
    }
  }

  async updateProviderUsageAfterMessage() {
    console.log('Updating provider usage after message...')
    try {
      const response = await fetch('/dashboard/connection_status', {
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const status = await response.json()
        console.log('Received status:', status)
        
        // Only update usage, not the status indicator
        const requestsUsage = document.getElementById('requests-usage')
        const tokensUsage = document.getElementById('tokens-usage')
        
        console.log('Found elements:', { requestsUsage, tokensUsage })
        
        if (status.usage && requestsUsage && tokensUsage) {
          const requests = status.usage.requests
          const tokens = status.usage.tokens
          
          console.log('Updating usage:', { requests, tokens })
          
          requestsUsage.textContent = `${requests.used}/${requests.limit}`
          tokensUsage.textContent = `${tokens.used}/${tokens.limit}`
          
          // Add visual feedback
          requestsUsage.style.backgroundColor = '#fef3c7'
          tokensUsage.style.backgroundColor = '#fef3c7'
          
          setTimeout(() => {
            requestsUsage.style.backgroundColor = ''
            tokensUsage.style.backgroundColor = ''
          }, 1000)
          
          console.log('Usage updated successfully')
        } else {
          console.log('Missing elements or usage data:', { 
            hasUsage: !!status.usage, 
            hasRequestsUsage: !!requestsUsage, 
            hasTokensUsage: !!tokensUsage 
          })
        }
      }
    } catch (error) {
      console.error('Error updating provider usage after message:', error)
    }
  }

  createUsageTooltip(usage) {
    const requests = usage.requests
    const tokens = usage.tokens
    
    return `API Usage:
Requests: ${requests.used}/${requests.limit} (${requests.percentage}%)
Tokens: ${tokens.used}/${tokens.limit} (${tokens.percentage}%)
Reset: ${usage.reset_requests}`
  }

  setupInfiniteScroll() {
    this.currentPage = 1
    this.isLoading = false
    this.hasMore = true
    
    const container = document.getElementById('chat-list-container')
    if (!container) return
    
    // Force scrollbar to be visible
    container.style.overflowY = 'scroll'
    
    container.addEventListener('scroll', (e) => {
      this.handleScroll(e)
    })
    
    // Log scroll container info for debugging
    console.log('Scroll container setup:', {
      element: container,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
      hasScrollbar: container.scrollHeight > container.clientHeight
    })
  }

  handleScroll(e) {
    const container = e.target
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    
    // Check if we're near the bottom (within 50px)
    if (scrollHeight - scrollTop - clientHeight < 50 && !this.isLoading && this.hasMore) {
      this.loadMoreChats()
    }
  }

  async loadMoreChats() {
    if (this.isLoading || !this.hasMore) return
    
    this.isLoading = true
    this.showLoadingIndicator()
    
    try {
      const response = await fetch(`/dashboard/load_more_chats?page=${this.currentPage}`, {
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        this.appendChats(data.chats)
        this.hasMore = data.has_more
        this.currentPage = data.next_page
        
        if (!this.hasMore) {
          this.showEndIndicator()
        }
      }
    } catch (error) {
      console.error('Error loading more chats:', error)
    } finally {
      this.isLoading = false
      this.hideLoadingIndicator()
    }
  }

  appendChats(chats) {
    const chatList = document.getElementById('chat-list')
    if (!chatList) return
    
    chats.forEach(chat => {
      const chatElement = document.createElement('div')
      chatElement.className = 'chat-item-container group relative'
      chatElement.dataset.chatId = chat.id
      chatElement.innerHTML = `
        <button class="chat-item w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors" data-chat-id="${chat.id}">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">${chat.title}</p>
              <p class="text-xs text-gray-500">${chat.message_count} message${chat.message_count !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </button>
        
        <!-- Hover Menu -->
        <div class="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="chat-menu-btn p-1 rounded hover:bg-gray-200 transition-colors" data-chat-id="${chat.id}">
            <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
          
          <!-- Dropdown Menu -->
          <div class="chat-menu-dropdown absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] hidden z-10">
            <button class="delete-chat-btn w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2" data-chat-id="${chat.id}" data-chat-title="${chat.title}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </div>
      `
      
      chatList.appendChild(chatElement)
    })
  }

  showLoadingIndicator() {
    const loading = document.getElementById('chat-loading')
    if (loading) {
      loading.classList.remove('hidden')
    }
  }

  hideLoadingIndicator() {
    const loading = document.getElementById('chat-loading')
    if (loading) {
      loading.classList.add('hidden')
    }
  }

  showEndIndicator() {
    const end = document.getElementById('chat-end')
    if (end) {
      end.classList.remove('hidden')
    }
  }

  resetInfiniteScroll() {
    this.currentPage = 1
    this.isLoading = false
    this.hasMore = true
    
    const end = document.getElementById('chat-end')
    if (end) {
      end.classList.add('hidden')
    }
  }



  showDeleteConfirmation(chatId, chatTitle) {
    this.chatToDelete = { id: chatId, title: chatTitle }
    
    const modal = document.getElementById('delete-chat-modal')
    const chatNameSpan = document.getElementById('delete-chat-name')
    
    if (modal && chatNameSpan) {
      chatNameSpan.textContent = chatTitle
      modal.classList.remove('hidden')
    }
  }

  hideDeleteConfirmation() {
    this.chatToDelete = null
    
    const modal = document.getElementById('delete-chat-modal')
    if (modal) {
      modal.classList.add('hidden')
    }
  }

  async deleteChat() {
    if (!this.chatToDelete) return
    
    const { id: chatId, title: chatTitle } = this.chatToDelete
    
    try {
      const response = await fetch(`/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        }
      })
      
      if (response.ok) {
        console.log("Chat deleted successfully:", chatTitle)
        
        // Remove the chat from the UI
        const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`)
        if (chatElement) {
          chatElement.remove()
        }
        
        // If this was the currently loaded chat, clear the chat area
        if (this.currentChatId === chatId) {
          this.currentChatId = null
          this.currentChatTitle = null
          this.chatTitleTarget.textContent = 'Welcome to SkyTorch'
          this.chatSubtitleTarget.textContent = 'Start a new conversation or select an existing chat'
          this.messagesContainerTarget.innerHTML = this.getWelcomeMessage()
          this.hideMessageInput()
          

        }
        
        // Hide the confirmation modal
        this.hideDeleteConfirmation()
        
        // Update the chat list to reflect the deletion
        await this.updateChatList()
      } else {
        console.error('Failed to delete chat:', response.statusText)
        alert('Failed to delete chat. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
      alert('Error deleting chat. Please try again.')
    }
  }

  async updateChatTitle(title) {
    try {
      const response = await fetch(`/chats/${this.currentChatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({
          chat: { title: title }
        })
      })
      
      if (response.ok) {
        console.log("Chat title updated to:", title)
        // Update the displayed title
        this.chatTitleTarget.textContent = title
        this.currentChatTitle = title
        
        // Update the title in the left navigation
        const chatItem = document.querySelector(`[data-chat-id="${this.currentChatId}"]`)
        if (chatItem) {
          const titleElement = chatItem.querySelector('.text-sm.font-medium.text-gray-900')
          if (titleElement) {
            titleElement.textContent = title
          }
        }
      }
    } catch (error) {
      console.error('Error updating chat title:', error)
    }
  }

  async generateAITitle(userMessage, aiResponse) {
    try {
      const response = await fetch(`/chats/${this.currentChatId}/generate_title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({
          user_message: userMessage,
          ai_response: aiResponse
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.title) {
          await this.updateChatTitle(result.title)
        }
      }
    } catch (error) {
      console.error('Error generating AI title:', error)
    }
  }

  getWelcomeMessage() {
    return `
      <div class="text-center py-12">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-white rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">🚀</span>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Welcome to SkyTorch</h3>
        <p class="text-gray-500 mb-6">Social AI tools with MCP integration</p>
        <button id="start-chat-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
          Start New Chat
        </button>
      </div>
    `
  }

  closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('mobile-overlay')
    
    if (sidebar && overlay) {
      sidebar.classList.remove('translate-x-0')
      sidebar.classList.add('-translate-x-full')
      overlay.classList.add('hidden')
      document.body.style.overflow = ''
    }
  }
}
