"use client"

import Navigation from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"
import { Service } from "@/types/service"
import { TbLoader3 } from "react-icons/tb"
import api from "@/lib/api"
import { About, AboutAREA } from "@/types/about"
import { useEffect, useState } from "react"
import { getBackendUrl } from "@/lib/config"
import { useRouter } from "next/navigation"

export default function CataloguePage() {
  const router = useRouter();
  const [about, setAbout] = useState<About | null>(null);

  const fetchApiAR = async () => {
    const res = await fetch(`${await getBackendUrl()}/about.json`);
    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }
    setAbout(await res.json());
  }

  useEffect(() => {
    fetchApiAR();
  }, []);

  const handleConnect = (service: AboutAREA, id: number, isAction: boolean) => {
    if (service.name && id) {
      window.location.href = `/my-areas?service=${service.id}&id=${id}&isAction=${isAction}`;
    }
  }

  return (
    <div className='min-h-screen bg-app-background'>
      <Navigation />

        <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Services Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {about && about.server.services.map((service: AboutAREA, index: number) => (
            <>
              {service.actions.length > 0 && service.actions.map((action, idx) => (
                <>
                  <Card
                    key={index}
                    className='bg-app-surface border-app-border-light hover:border-area-primary transition-all duration-300 hover:shadow-lg group'
                  >
                    <CardContent className='p-6'>

                      <div className="flex items-center justify-between mb-4">
                        <div className='flex flex-col gap-2'>
                          <h3 className='font-heading text-xl font-bold text-app-text-primary leading-none'>
                            {service.name}
                          </h3>
                          <Badge className='bg-transparent outline outline-app-border-light text-primary w-fit'>Action</Badge>
                        </div>
                        <div className='bg-app-background rounded-lg w-14 h-14 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300' dangerouslySetInnerHTML={{ __html: service.icon.replaceAll("1em", "2.5em") }}></div>
                      </div>

                      <p className='text-app-text-secondary text-sm mb-6 items-center flex line-clamp-3 min-h-[60px]'>
                          {action.description}
                      </p>

                      <Button
                          onClick={() => handleConnect(service, action.id, true)}
                          variant='outline'
                          className='w-full border-app-red-primary text-app-red-primary hover:bg-app-red-primary hover:text-blue-400 transition-all duration-300 cursor-pointer'
                      >
                          Add this action
                      </Button>
                      </CardContent>
                    </Card>
                  </>
                ))}
                {service.reactions.length > 0 && service.reactions.map((reaction, idx) => (
                  <>
                    <Card
                      key={index}
                      className='bg-app-surface border-app-border-light hover:border-area-primary transition-all duration-300 hover:shadow-lg group'
                    >
                      <CardContent className='p-6'>
                      <div className="flex items-center justify-between mb-4">
                        <div className='flex flex-col gap-2'>
                          <h3 className='font-heading text-xl font-bold text-app-text-primary leading-none'>
                            {service.name}
                          </h3>
                          <Badge className='bg-transparent outline outline-app-border-light text-primary w-fit'>Reaction</Badge>
                        </div>
                        <div className='bg-app-background rounded-lg w-14 h-14 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300' dangerouslySetInnerHTML={{ __html: service.icon.replaceAll("1em", "2.5em") }}></div>
                      </div>

                      <p className='text-app-text-secondary items-center flex text-sm mb-6 line-clamp-3 min-h-[60px]'>
                          {reaction.description}
                      </p>

                      <Button
                          onClick={() => handleConnect(service, reaction.id, false)}
                          variant='outline'
                          className='w-full border-app-red-primary text-app-red-primary hover:bg-app-red-primary hover:text-blue-400 transition-all duration-300 cursor-pointer'
                      >
                          Add this reaction
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ))}
            </>
          ))}
        </div>
      </main>
    </div>
    )
}