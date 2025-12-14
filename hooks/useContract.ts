"use client"

import { useState, useEffect } from "react"
import {
  useCurrentAccount,
  useIotaClient,
  useSignAndExecuteTransaction,
  useIotaClientQuery,
} from "@iota/dapp-kit"
import { Transaction } from "@iota/iota-sdk/transactions"
import type { IotaObjectData } from "@iota/iota-sdk/client"
import { TESTNET_PACKAGE_ID } from "@/lib/config"

// CONFIG
const PACKAGE_ID = TESTNET_PACKAGE_ID
export const CONTRACT_MODULE = "crowdfunding" // Sesuaikan nama module

export const CONTRACT_METHODS = {
  DONATE: "donate",
  WITHDRAW: "withdraw_funds",
} as const

// HELPERS
function getObjectFields(data: IotaObjectData): { owner: string; balance?: string } | null {
  if (data.content?.dataType !== "moveObject") return null
  const fields = data.content.fields as any
  if (!fields) return null
  
  const owner = data.owner && typeof data.owner === "object" && "AddressOwner" in data.owner
    ? String(data.owner.AddressOwner)
    : "Shared"
    
  const balance = fields.balance ? String(fields.balance) : "0"
  return { owner, balance }
}

// TYPES
export interface ContractActions {
  donate: (amount: string, fundId: string) => Promise<void>
  withdraw: (adminCapId: string, fundId: string) => Promise<void>
  clearObject: () => void
}

// MAIN HOOK
export const useContract = () => {
  const currentAccount = useCurrentAccount()
  const iotaClient = useIotaClient()
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()
  const [objectId, setObjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hash, setHash] = useState<string | undefined>()
  const [transactionError, setTransactionError] = useState<Error | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hash.slice(1)
      if (h) setObjectId(h)
    }
  }, [])

  const { data, isPending: isFetching, error: queryError } = useIotaClientQuery("getObject", 
    { id: objectId!, options: { showContent: true, showOwner: true } }, 
    { enabled: !!objectId }
  )

  const fields = data?.data ? getObjectFields(data.data) : null

  // 1. DONATE FUNCTION
  const donate = async (amount: string, fundId: string) => {
    try {
      setIsLoading(true); setTransactionError(null); setHash(undefined)
      const tx = new Transaction()
      const amountInMist = Number(amount) * 1_000_000_000;
      
      const [coinPayment] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)])
      
      tx.moveCall({
        target: `${PACKAGE_ID}::${CONTRACT_MODULE}::${CONTRACT_METHODS.DONATE}`,
        arguments: [tx.object(fundId), coinPayment],
      })

      signAndExecute({ transaction: tx }, {
          onSuccess: async ({ digest }) => {
            setHash(digest); await iotaClient.waitForTransaction({ digest }); setIsLoading(false)
          },
          onError: (err) => {
            setTransactionError(err instanceof Error ? err : new Error(String(err))); setIsLoading(false)
          },
      })
    } catch (err) { console.error(err); setIsLoading(false) }
  }

  // 2. WITHDRAW FUNCTION
  const withdraw = async (adminCapId: string, fundId: string) => {
    try {
      setIsLoading(true); setTransactionError(null); setHash(undefined)
      const tx = new Transaction()

      tx.moveCall({
        target: `${PACKAGE_ID}::${CONTRACT_MODULE}::${CONTRACT_METHODS.WITHDRAW}`,
        arguments: [tx.object(adminCapId), tx.object(fundId)],
      })

      signAndExecute({ transaction: tx }, {
          onSuccess: async ({ digest }) => {
            setHash(digest); await iotaClient.waitForTransaction({ digest }); setIsLoading(false)
          },
          onError: (err) => {
            setTransactionError(err instanceof Error ? err : new Error(String(err))); setIsLoading(false)
          },
      })
    } catch (err) { console.error(err); setIsLoading(false) }
  }

  return {
    data: fields ? { owner: fields.owner, balance: fields.balance } : null,
    actions: { donate, withdraw, clearObject: () => setObjectId(null) },
    state: { isLoading: isLoading || isPending || isFetching, hash, error: queryError || transactionError },
    objectId
  }
}