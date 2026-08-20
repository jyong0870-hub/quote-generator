import { NextRequest, NextResponse } from "next/server";

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;

interface LineItem {
  name: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  amount: number;
}

interface CreateQuoteRequest {
  companyName: string;
  items: LineItem[];
  totalWithVat: number;
  dealId?: string;
}

export async function POST(req: NextRequest) {
  if (!HUBSPOT_API_KEY) {
    return NextResponse.json(
      { error: "HUBSPOT_API_KEY not configured. Set it in .env.local" },
      { status: 503 }
    );
  }

  const body: CreateQuoteRequest = await req.json();
  const { companyName, items, dealId } = body;

  const headers = {
    Authorization: `Bearer ${HUBSPOT_API_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. Create the Quote
    const quoteRes = await fetch(
      "https://api.hubapi.com/crm/v3/objects/quotes",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          properties: {
            hs_title: `${companyName} 견적서`,
            hs_expiration_date: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0],
            hs_status: "DRAFT",
            hs_currency: "KRW",
          },
        }),
      }
    );
    if (!quoteRes.ok) {
      const err = await quoteRes.json();
      throw new Error(`Quote creation failed: ${JSON.stringify(err)}`);
    }
    const quote = await quoteRes.json();
    const quoteId = quote.id;

    // 2. Create Line Items and associate with Quote
    const lineItemIds: string[] = [];
    for (const item of items) {
      const liRes = await fetch(
        "https://api.hubapi.com/crm/v3/objects/line_items",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            properties: {
              name: item.name,
              quantity: String(item.qty),
              price: String(item.unitPrice),
              discount: String(item.discountPct),
              amount: String(item.amount),
              hs_product_id: null,
            },
          }),
        }
      );
      if (!liRes.ok) {
        const err = await liRes.json();
        console.error("LineItem creation failed:", err);
        continue;
      }
      const li = await liRes.json();
      lineItemIds.push(li.id);
    }

    // 3. Associate line items with quote
    if (lineItemIds.length > 0) {
      await fetch(
        `https://api.hubapi.com/crm/v3/objects/quotes/${quoteId}/associations/line_items/batch/create`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            inputs: lineItemIds.map((liId) => ({
              from: { id: quoteId },
              to: { id: liId },
              type: "quote_to_line_item",
            })),
          }),
        }
      );
    }

    // 4. Associate with Deal (optional)
    if (dealId) {
      await fetch(
        `https://api.hubapi.com/crm/v3/objects/quotes/${quoteId}/associations/deals/batch/create`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            inputs: [
              {
                from: { id: quoteId },
                to: { id: dealId },
                type: "quote_to_deal",
              },
            ],
          }),
        }
      );
    }

    return NextResponse.json({
      success: true,
      quoteId,
      quoteUrl: `https://app.hubspot.com/contacts/20361262/objects/0-14/views/all/list?hs_quote_id=${quoteId}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
