"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

interface EventCountdownProps {
  eventDate?: Date;
  className?: string;
}

export function EventCountdown({ eventDate, className }: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [isEventPassed, setIsEventPassed] = useState(false);

  useEffect(() => {
    if (!eventDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const eventTime = new Date(eventDate).getTime();
      const difference = eventTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsEventPassed(false);
      } else {
        setIsEventPassed(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [eventDate]);

  if (!eventDate) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center">
          <Icon name="Calendar" size="sm" className="text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No event date set</p>
        </div>
      </Card>
    );
  }

  if (isEventPassed) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center">
          <Icon name="PartyPopper" size="sm" className="text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-600">Event completed!</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(eventDate).toLocaleDateString()}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-2">
          <Icon name="Clock" size="sm" className="text-primary-500" />
          <span className="text-sm font-medium text-gray-700">Countdown</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-primary-50 rounded p-2">
            <div className="font-bold text-primary-600">{timeLeft.days}</div>
            <div className="text-gray-500">Days</div>
          </div>
          <div className="bg-primary-50 rounded p-2">
            <div className="font-bold text-primary-600">{timeLeft.hours}</div>
            <div className="text-gray-500">Hours</div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          {new Date(eventDate).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}
