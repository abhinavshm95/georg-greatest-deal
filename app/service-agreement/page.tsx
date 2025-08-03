const ServiceAgreementPage: React.FC = () => {
  return (
    <section className="container mx-auto">
      <div className="max-w-screen-lg my-20">
        <h1 className="text-4xl my-8">Closed Beta Service Agreement</h1>
        <p className="mb-2 text-gray-600">
          This Closed Beta Service Agreement ("Agreement") is entered into as of
          date of subscription by and between:
        </p>
        <p className="mb-2 text-gray-600">
          OMG E-Commerce GmbH (the “Company“), a company organized and existing
          under the laws of Germany, with its principal place of business at
          Damenstiftstraße 12 80331 München, and
        </p>
        <p className="mb-2 text-gray-600">
          YOU asa Beta Tester (the "Beta Tester").
        </p>
        <h2 className="text-3xl mb-2 mt-4">Background</h2>

        <p className="mb-2 text-gray-600">
          Company is developing a service (the "Service") and desires to engage
          Beta Tester to participate in a closed beta testing program for the
          Service.
        </p>
        <p className="mb-2 text-gray-600">
          Beta Tester desires to participate in the closed beta testing program
          and to provide feedback to Company regarding the Service.
        </p>
        <h2 className="text-3xl mb-2 mt-4">Agreement</h2>

        <ol className="list-decimal ml-4 mb-4">
          <li>
            <strong>Beta Testing Services:</strong> During the term of this
            Agreement, Beta Tester agrees to test the Service and provide
            feedback to Company regarding its performance, functionality, and
            any issues encountered during use.
          </li>
          <li>
            <strong>Access to Service:</strong> Company will provide Beta Tester
            with access to the Service for the sole purpose of testing and
            evaluation during the beta testing period.
          </li>
          <li>
            <strong>Confidentiality:</strong> Beta Tester agrees to keep all
            information related to the Service, including but not limited to
            features, functionality, and performance, confidential and will not
            disclose such information to any third party without the prior
            written consent of Company.
          </li>
          <li>
            <strong>Feedback:</strong> Beta Tester agrees to promptly provide
            Company with feedback, including but not limited to any bugs,
            errors, or suggested improvements discovered during the testing
            period.
          </li>
          <li>
            <strong>Ownership:</strong> Beta Tester acknowledges that Company is
            the sole owner of all rights, title, and interest in and to the
            Service, including all intellectual property rights.
          </li>
          <li>
            <strong>Limitation of Liability:</strong> Beta Tester agrees that
            Company shall not be liable for any direct, indirect, incidental,
            special, consequential, or exemplary damages, including but not
            limited to, damages for loss of profits, goodwill, use, data, or
            other intangible losses, resulting from the use or inability to use
            the Service.
          </li>
          <li>
            <strong>Term and Termination:</strong> This Agreement shall commence
            on the Effective Date and shall continue until to be announced.
            Either party may terminate this Agreement at any time upon written
            notice to the other party.
          </li>
          <li>
            <strong>Indemnification:</strong> Beta Tester agrees to indemnify
            and hold harmless Company from and against any claims, damages,
            liabilities, costs, and expenses arising out of or related to Beta
            Tester's use of the Service.
          </li>
          <li>
            <strong>Governing Law:</strong> This Agreement shall be governed by
            and construed in accordance with the laws of Germany.
          </li>
          <li>
            <strong>Entire Agreement:</strong> This Agreement constitutes the
            entire agreement between the parties regarding the subject matter
            hereof and supersedes all prior and contemporaneous agreements and
            understandings, whether written or oral.
          </li>
        </ol>
        <p className="mb-2 text-gray-600">
          IN WITNESS WHEREOF, the parties hereto have executed this Agreement as
          of the Effective Date first above written.
        </p>
      </div>
    </section>
  );
};
export default ServiceAgreementPage;
