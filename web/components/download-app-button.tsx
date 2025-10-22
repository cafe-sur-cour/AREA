"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Download } from "lucide-react"

export default function DownloadAPPButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="fixed bottom-4 right-4 rounded-full shadow-lg"
            size="icon"
            onClick={() => { window.location.href = '/client.apk' }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download app for mobile</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
