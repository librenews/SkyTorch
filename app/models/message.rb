class Message < ApplicationRecord
  belongs_to :chat
  
  validates :content, presence: true
  validates :role, presence: true, inclusion: { in: %w[user assistant system] }
end
